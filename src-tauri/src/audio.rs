use crate::state::AudioStateRef; // Use state types from the new module
use cpal::traits::{DeviceTrait, StreamTrait};
use rodio::{Decoder, OutputStream, Sink};
use std::io::Cursor;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

/// Function to handle the actual audio recording to memory (runs in a separate thread)
/// Marked pub(crate) as it's called by a command within the same crate.
pub(crate) fn record_to_memory(
    state: AudioStateRef,
    device: cpal::Device,
    config: cpal::SupportedStreamConfig, // config is moved here
    sample_format: cpal::SampleFormat, // Pass pre-extracted format
) -> Result<(), String> {
    let pcm_data_buffer = Arc::new(Mutex::new(Vec::<u8>::new()));
    let channels = config.channels();
    let sample_rate = config.sample_rate().0;
    let err_fn = |err| eprintln!("an error occurred on the audio stream: {}", err);
    let state_clone = state.clone();
    let pcm_data_buffer_clone = pcm_data_buffer.clone();
    let stream_config: cpal::StreamConfig = config.into(); // config is moved here

    println!(
        "Attempting to build input stream ({} Hz, {} ch, {:?})",
        stream_config.sample_rate.0, stream_config.channels, sample_format
    );

    // Simplified stream building logic using closures
    let stream = match sample_format {
        cpal::SampleFormat::I16 => device.build_input_stream(
            &stream_config,
            move |data: &[i16], _: &_| {
                if state_clone.lock().unwrap().is_recording {
                    if let Ok(mut b) = pcm_data_buffer_clone.lock() {
                        for s in data {
                            b.extend_from_slice(&s.to_le_bytes());
                        }
                    }
                }
            },
            err_fn,
            None,
        ),
        cpal::SampleFormat::U16 => device.build_input_stream(
            &stream_config,
            move |data: &[u16], _: &_| {
                if state_clone.lock().unwrap().is_recording {
                    if let Ok(mut b) = pcm_data_buffer_clone.lock() {
                        for s in data {
                            let i = s.saturating_sub(32768) as i16;
                            b.extend_from_slice(&i.to_le_bytes());
                        }
                    }
                }
            },
            err_fn,
            None,
        ),
        cpal::SampleFormat::F32 => device.build_input_stream(
            &stream_config,
            move |data: &[f32], _: &_| {
                if state_clone.lock().unwrap().is_recording {
                    if let Ok(mut b) = pcm_data_buffer_clone.lock() {
                        for s in data {
                            let i = (s.clamp(-1.0, 1.0) * 32767.0) as i16;
                            b.extend_from_slice(&i.to_le_bytes());
                        }
                    }
                }
            },
            err_fn,
            None,
        ),
        _ => return Err(format!("Unsupported sample format: {:?}", sample_format)),
    }
    .map_err(|e| format!("Could not build input stream: {}", e))?;

    stream
        .play()
        .map_err(|e| format!("Could not start stream: {}", e))?;
    println!("Recording stream started.");

    // Loop relies on the is_recording flag in the shared state
    while state.lock().map_err(|e| e.to_string())?.is_recording {
        thread::sleep(Duration::from_millis(50));
    }

    println!("Recording stream stopping (flag turned false)...");
    drop(stream); // Drop the stream explicitly to stop hardware interaction
    println!("Recording stream stopped.");

    // Finalize WAV data
    if let Ok(pcm_data) = pcm_data_buffer.lock() {
        println!("PCM data collected: {} bytes", pcm_data.len());
        if pcm_data.is_empty() {
            println!("Warning: No PCM data collected.");
            // Store empty Vec instead of None to simplify frontend checks?
            state.lock().map_err(|e| e.to_string())?.audio_data = Some(Vec::new());
            return Ok(());
        }
        match create_wav_memory(&pcm_data, channels, sample_rate) {
            Ok(wav_data) => {
                println!("WAV data created: {} bytes", wav_data.len());
                state.lock().map_err(|e| e.to_string())?.audio_data = Some(wav_data);
            }
            Err(e) => {
                eprintln!("Failed to create WAV data: {}", e);
                state.lock().map_err(|e| e.to_string())?.audio_data = None; // Ensure None on error
                return Err(e);
            }
        }
    } else {
        eprintln!("Failed to lock PCM data buffer after recording.");
        state.lock().map_err(|e| e.to_string())?.audio_data = None; // Ensure None on error
        return Err("Failed to lock PCM buffer".to_string());
    }
    Ok(())
}

/// Helper function to create a WAV file structure in memory from raw PCM data
/// Marked pub(crate) as it's called by record_to_memory within the same crate.
pub(crate) fn create_wav_memory(
    pcm_data: &[u8],
    channels: u16,
    sample_rate: u32,
) -> Result<Vec<u8>, String> {
    let bits_per_sample: u16 = 16;
    let bytes_per_sample = bits_per_sample / 8;
    let block_align = channels * bytes_per_sample;
    let byte_rate = sample_rate * u32::from(block_align);
    let data_size = pcm_data.len() as u32;

    if data_size == 0 {
        println!("Warning: Creating WAV from empty PCM data.");
    }

    // RIFF header (12) + fmt chunk (24) + data chunk header (8) = 44 bytes header size
    let file_size = 36 + data_size; // Size field in RIFF header is file size - 8 bytes
    let mut wav_data = Vec::with_capacity(44 + pcm_data.len());

    // RIFF chunk descriptor
    wav_data.extend_from_slice(b"RIFF");
    wav_data.extend_from_slice(&file_size.to_le_bytes()); // ChunkSize
    wav_data.extend_from_slice(b"WAVE");

    // fmt sub-chunk
    wav_data.extend_from_slice(b"fmt ");
    wav_data.extend_from_slice(&16u32.to_le_bytes()); // Subchunk1Size (16 for PCM)
    wav_data.extend_from_slice(&1u16.to_le_bytes()); // AudioFormat (1 = PCM)
    wav_data.extend_from_slice(&channels.to_le_bytes()); // NumChannels
    wav_data.extend_from_slice(&sample_rate.to_le_bytes()); // SampleRate
    wav_data.extend_from_slice(&byte_rate.to_le_bytes()); // ByteRate
    wav_data.extend_from_slice(&block_align.to_le_bytes()); // BlockAlign
    wav_data.extend_from_slice(&bits_per_sample.to_le_bytes()); // BitsPerSample

    // data sub-chunk
    wav_data.extend_from_slice(b"data");
    wav_data.extend_from_slice(&data_size.to_le_bytes()); // Subchunk2Size
    wav_data.extend_from_slice(pcm_data); // Actual sound data

    Ok(wav_data)
}

/// Helper function to play audio from memory (runs in a separate thread)
/// Marked pub(crate) as it's called by a command within the same crate.
pub(crate) fn play_audio_from_memory(audio_data: &[u8]) -> Result<(), String> {
    if audio_data.len() < 44 {
        // Basic check for WAV header size
        return Err("Invalid or too short audio data for playback".to_string());
    }
    let (_stream, stream_handle) = OutputStream::try_default()
        .map_err(|e| format!("Failed to create audio output stream: {}", e))?;
    let sink = Sink::try_new(&stream_handle)
        .map_err(|e| format!("Failed to create audio sink: {}", e))?;
    let cursor = Cursor::new(audio_data.to_vec()); // rodio needs owned data
    let source = Decoder::new(cursor).map_err(|e| format!("Could not decode audio: {}", e))?;
    sink.append(source);
    sink.sleep_until_end(); // Block thread until playback is finished
    Ok(())
}
