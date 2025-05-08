use crate::state::RecordingFlag;
use cpal::traits::{DeviceTrait, StreamTrait};
use crossbeam_channel::Sender;
use std::sync::atomic::Ordering;
use std::thread;
use std::time::Duration;

const AUDIO_CHUNK_SIZE_SAMPLES: usize = 1024;

pub(crate) fn record_audio_stream(
    recording_flag: RecordingFlag,
    data_sender: Sender<Vec<i16>>,
    device: cpal::Device,
    config: cpal::SupportedStreamConfig,
    sample_format: cpal::SampleFormat,
) -> Result<(), String> {
    let err_fn = |err| eprintln!("an error occurred on the audio stream: {}", err);
    let stream_config: cpal::StreamConfig = config.into();
    let flag_clone = recording_flag.clone();

    println!(
        "Audio Stream: {} Hz, {} ch, {:?}",
        stream_config.sample_rate.0, stream_config.channels, sample_format
    );

    let process_data = move |data: &[i16]| {
        if flag_clone.load(Ordering::SeqCst) {
            for chunk in data.chunks(AUDIO_CHUNK_SIZE_SAMPLES) {
                match data_sender.send(chunk.to_vec()) {
                    Ok(_) => {}
                    Err(e) => {
                        eprintln!("Audio thread failed to send data: {}. Stopping.", e);
                        flag_clone.store(false, Ordering::SeqCst);
                        break;
                    }
                }
            }
        }
    };

    let stream = match sample_format {
        cpal::SampleFormat::I16 => device.build_input_stream(
            &stream_config,
            move |data: &[i16], _: &_| process_data(data),
            err_fn,
            None,
        ),
        cpal::SampleFormat::U16 => device.build_input_stream(
            &stream_config,
            move |data: &[u16], _: &_| {
                let converted_data: Vec<i16> = data
                    .iter()
                    .map(|&s| s.saturating_sub(32768) as i16)
                    .collect();
                process_data(&converted_data);
            },
            err_fn,
            None,
        ),
        cpal::SampleFormat::F32 => device.build_input_stream(
            &stream_config,
            move |data: &[f32], _: &_| {
                let converted_data: Vec<i16> = data
                    .iter()
                    .map(|&s| (s.clamp(-1.0, 1.0) * 32767.0) as i16)
                    .collect();
                process_data(&converted_data);
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
    println!("Recording stream started. Sending data via channel.");

    while recording_flag.load(Ordering::SeqCst) {
        thread::sleep(Duration::from_millis(50));
    }

    println!("Recording stream stopping (flag turned false)...");
    drop(stream);
    println!("Recording stream stopped.");

    Ok(())
}
