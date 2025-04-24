// Declare modules
mod audio;
mod screenshot; // Declare the screenshot module
mod state; // Declare the new api module

// Use necessary items from modules and external crates
use state::{
    AppStateRef,
    AudioConfig,
    AudioConfigRef, // Use AudioConfigRef
    RecorderState,
    RecordingFlag, // Use RecordingFlag (Removed SoundState, SoundStateRef)
};
use std::sync::atomic::{AtomicBool, Ordering}; // Use Atomics
                                               // Removed unused: use std::sync::Arc;
use cpal::traits::{DeviceTrait, HostTrait};
use crossbeam_channel::unbounded; // Use crossbeam channel (Receiver import removed)
use rodio::Sink; // Added rodio imports
use std::fs::File; // Added File import
use std::io::BufReader;
use std::thread;
use std::time::Duration;
use tauri::menu::{MenuBuilder, MenuItem}; // Import MenuBuilder, remove MenuSeparator
use tauri::tray::TrayIconBuilder; // Added for Tray Icon
use tauri::Manager;
use tauri::{path::BaseDirectory, Emitter}; // Added BaseDirectory
use tauri_plugin_positioner::{Position, WindowExt}; // Added BufReader import

// --- Helper Functions ---

/// Emits a state change event to the frontend.
fn emit_state_change(app_handle: &tauri::AppHandle, new_state: RecorderState) {
    println!("Emitting state change: {:?}", new_state);
    if let Err(e) = app_handle.emit("state_changed", &new_state) {
        eprintln!("Failed to emit state_changed event: {}", e);
    }
}

/// Helper function to create a WAV file structure in memory from raw PCM data (i16 little-endian).
/// Moved here from audio.rs as it's used in the post-processing task.
fn create_wav_memory(
    pcm_data: &[i16], // Expecting Vec<i16> now
    channels: u16,
    sample_rate: u32,
) -> Result<Vec<u8>, String> {
    let bits_per_sample: u16 = 16;
    let bytes_per_sample = bits_per_sample / 8; // Should be 2
    let block_align = channels * bytes_per_sample;
    let byte_rate = sample_rate * u32::from(block_align);

    // Convert i16 samples to bytes
    let pcm_data_bytes: Vec<u8> = pcm_data
        .iter()
        .flat_map(|&sample| sample.to_le_bytes())
        .collect();
    let data_size = pcm_data_bytes.len() as u32;

    if data_size == 0 {
        println!("Warning: Creating WAV from empty PCM data.");
    }

    let file_size = 36 + data_size;
    let mut wav_data = Vec::with_capacity(44 + pcm_data_bytes.len());

    // RIFF chunk descriptor
    wav_data.extend_from_slice(b"RIFF");
    wav_data.extend_from_slice(&file_size.to_le_bytes());
    wav_data.extend_from_slice(b"WAVE");
    // fmt sub-chunk
    wav_data.extend_from_slice(b"fmt ");
    wav_data.extend_from_slice(&16u32.to_le_bytes());
    wav_data.extend_from_slice(&1u16.to_le_bytes()); // PCM
    wav_data.extend_from_slice(&channels.to_le_bytes());
    wav_data.extend_from_slice(&sample_rate.to_le_bytes());
    wav_data.extend_from_slice(&byte_rate.to_le_bytes());
    wav_data.extend_from_slice(&block_align.to_le_bytes());
    wav_data.extend_from_slice(&bits_per_sample.to_le_bytes());
    // data sub-chunk
    wav_data.extend_from_slice(b"data");
    wav_data.extend_from_slice(&data_size.to_le_bytes());
    wav_data.extend_from_slice(&pcm_data_bytes);

    Ok(wav_data)
}

/// Plays a sound file using rodio in a separate thread.
fn play_sound_rodio(app_handle: &tauri::AppHandle, sound_name: &str) {
    let sound_path = match app_handle.path().resolve(
        format!("assets/sounds/{}", sound_name),
        BaseDirectory::Resource,
    ) {
        Ok(path) => path,
        Err(e) => {
            eprintln!("Failed to resolve sound path for {}: {}", sound_name, e);
            return;
        }
    };

    // Spawn a thread to play the sound to avoid blocking
    thread::spawn(move || {
        match rodio::OutputStream::try_default() {
            Ok((_stream, stream_handle)) => {
                match File::open(&sound_path) {
                    Ok(file) => {
                        let file = BufReader::new(file);
                        match rodio::Decoder::new(file) {
                            Ok(source) => {
                                let sink = Sink::try_new(&stream_handle).unwrap();
                                sink.set_volume(0.5); // Set volume to 50%
                                sink.append(source);
                                // Wait for the sound to finish playing before the thread exits
                                sink.sleep_until_end();
                                println!("Played sound: {:?}", sound_path);
                            }
                            Err(e) => {
                                eprintln!("Error decoding sound file {:?}: {}", sound_path, e)
                            }
                        }
                    }
                    Err(e) => eprintln!("Error opening sound file {:?}: {}", sound_path, e),
                }
            }
            Err(e) => eprintln!("Error getting default audio output stream: {}", e),
        }
    });
}

// --- Tauri Commands ---

/// Hide the main window (if used - kept for potential future use)
#[tauri::command]
fn hide_window(window: tauri::AppHandle) -> Result<(), String> {
    window
        .get_webview_window("main")
        .ok_or_else(|| "Main window not found".to_string())?
        .hide()
        .map_err(|e| e.to_string())
}

/// Show the main window (if used - kept for potential future use)
#[tauri::command]
fn show_window(window: tauri::AppHandle) -> Result<(), String> {
    window
        .get_webview_window("main")
        .ok_or_else(|| "Main window not found".to_string())?
        .show()
        .map_err(|e| e.to_string())
}

/// Command to perform clipboard paste operations on macOS
#[tauri::command]
async fn perform_clipboard_paste(text: String, app_handle: tauri::AppHandle) -> Result<(), String> {
    println!("Executing perform_clipboard_paste command for text: '{}'", text);
    
    // 1. Save current clipboard content
    use tauri_plugin_clipboard_manager::ClipboardExt;
    let previous_clipboard = app_handle.clipboard().read_text().unwrap_or_default();
    println!("Saved current clipboard content");

    // 2. Copy new text to clipboard
    if let Err(e) = app_handle.clipboard().write_text(text.clone()) {
        return Err(format!("Failed to write to clipboard: {}", e));
    }
    println!("Text successfully copied to clipboard");

    // 3. Give focus back to the previous window before pasting
    tokio::time::sleep(tokio::time::Duration::from_millis(20)).await; // Short delay

    // 4. Simulate Paste using AppleScript on macOS
    #[cfg(target_os = "macos")]
    {
        println!("Attempting to simulate paste via AppleScript using shell plugin...");
        use tauri_plugin_shell::ShellExt;
        
        let script = r#"tell application "System Events" to keystroke "v" using command down"#;
        let shell = app_handle.shell(); // Get the shell instance
        let output_result = shell
            .command("osascript")
            .args(["-e", script])
            .output() // Execute and wait for output
            .await;

        match output_result {
            Ok(output) => {
                if output.status.success() {
                    println!("AppleScript paste command executed successfully.");
                    if !output.stdout.is_empty() {
                        println!("osascript stdout: {}", String::from_utf8_lossy(&output.stdout));
                    }
                } else {
                    eprintln!("AppleScript paste command failed with status: {:?}", output.status);
                    if !output.stderr.is_empty() {
                        eprintln!("osascript stderr: {}", String::from_utf8_lossy(&output.stderr));
                    }
                    return Err(format!("AppleScript execution failed: {:?}", output.status));
                }
            }
            Err(e) => {
                eprintln!("Failed to execute osascript for paste using shell plugin: {}", e);
                return Err(format!("Failed to execute AppleScript: {}", e));
            }
        }
    }
    #[cfg(not(target_os = "macos"))]
    {
        // On other platforms, we don't attempt to paste
        println!("Automatic paste via script not supported on this OS.");
    }

    // 5. Wait a bit before restoring the clipboard
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

    // 6. Restore original clipboard content
    if let Err(e) = app_handle.clipboard().write_text(previous_clipboard) {
        eprintln!("Failed to restore clipboard: {}", e);
        return Err(format!("Failed to restore clipboard: {}", e));
    }
    println!("Original clipboard content restored after paste and delay");

    // 7. No sound needed for clipboard operation
    
    Ok(())
}

// --- Application Entry Point ---

// Make run async because we use .await for mutexes inside setup/commands
#[cfg_attr(mobile, tauri::mobile_entry_point)]
#[tokio::main] // Use tokio main runtime
pub async fn run() {
    // Make run async
    // Initialize states
    let audio_config = AudioConfigRef::new(tokio::sync::Mutex::new(AudioConfig::new())); // Use tokio Mutex
    let app_state = AppStateRef::new(tokio::sync::Mutex::new(RecorderState::Idle)); // Use tokio Mutex
    let recording_flag = RecordingFlag::new(AtomicBool::new(false)); // Initialize recording flag

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init()) // Initialize shell plugin
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_positioner::init())
        .invoke_handler(tauri::generate_handler![
            hide_window,
            show_window,
            perform_clipboard_paste,
            screenshot::capture_screenshot
        ])
        .manage(audio_config.clone())
        .manage(app_state.clone())
        .manage(recording_flag.clone()) // Manage the recording flag
        // SoundStateRef management removed
        .setup(move |app| {
            #[cfg(target_os = "macos")]{
                app.set_activation_policy(tauri::ActivationPolicy::Accessory);
            };

            // --- Setup System Tray ---
            let app_handle_tray = app.handle().clone(); // Clone handle for tray event handler
            // Create menu items first
            let show_chat_i = MenuItem::with_id(&app_handle_tray, "show_chat", "Show Chat", true, None::<&str>)?;
            let show_settings_i = MenuItem::with_id(&app_handle_tray, "show_settings", "Settings", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(&app_handle_tray, "quit", "Exit", true, None::<&str>)?;

            // Use MenuBuilder
            let tray_menu = MenuBuilder::new(&app_handle_tray)
                .item(&show_chat_i)
                .item(&show_settings_i)
                .separator() // Use the builder method for separator
                .item(&quit_i)
                .build()?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().cloned().ok_or("Failed to get default window icon")?)
                .tooltip("Vaiced")
                .menu(&tray_menu)
                .on_menu_event(move |app, event| {
                    match event.id.as_ref() {
                        "show_chat" => {
                            // Now targets the main window which displays the chat UI
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            } else {
                                eprintln!("main (chat) window not found");
                            }
                        }
                        "show_settings" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            } else {
                                eprintln!("main window not found");
                            }
                        }
                        "quit" => {
                            println!("Exit requested from tray menu.");
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                // Optional: Handle tray icon click events if needed
                // .on_tray_icon_event(|tray, event| {
                //     if let TrayIconEvent::Click { .. } = event {
                //         // Example: toggle main window on left click
                //         // let app = tray.app_handle();
                //         // if let Some(window) = app.get_webview_window("main") {
                //         //     let _ = window.show();
                //         //     let _ = window.set_focus();
                //         // }
                //     }
                // })
                .build(app)?;


            // --- Setup Global Shortcut ---
            #[cfg(desktop)]
            {
                use tauri_plugin_global_shortcut::{
                    Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState,
                };

                let recorder_shortcut = Shortcut::new(Some(Modifiers::META), Code::Backquote);
                let ai_shortcut = Shortcut::new(Some(Modifiers::ALT), Code::Backquote); // ALT for Option key
                let clipboard_shortcut = Shortcut::new(Some(Modifiers::CONTROL), Code::Backquote); // CTRL for clipboard functionality

                // Recorder window setup block removed.

                // --- AI Interaction Window Setup (Now the Main Window) ---
                if let Some(main_window) = app.get_webview_window("main") {
                    println!("Setting up main (AI interaction) window (TopRight, initially visible)...");
                    // Position the window programmatically using the positioner plugin
                    let _ = main_window.move_window(Position::TopRight); // Restore programmatic positioning
                    // Window is visible by default as per tauri.conf.json
                    // Optional: Add close handler if needed, similar to recorder
                    // main_window.on_window_event(...)
                } else {
                    eprintln!("Failed to get main window during setup.");
                }


                // --- Global Shortcut Handler ---
                // Need to clone states again for the handler's lifetime
                let audio_config_handler = audio_config.clone();
                let app_state_handler = app_state.clone();
                // sound_state_handler clone removed
                let recording_flag_handler = recording_flag.clone();

                app.handle().plugin(
                    tauri_plugin_global_shortcut::Builder::new()
                        .with_handler(move |app, shortcut, event| {
                            // Clone Arcs needed inside the async block
                            let audio_config_clone = audio_config_handler.clone();
                            let app_state_clone = app_state_handler.clone();
                            // sound_state_clone clone removed
                            let recording_flag_clone = recording_flag_handler.clone();
                            let app_handle_clone = app.clone(); // Clone AppHandle
                            let shortcut_clone = shortcut.clone(); // Clone shortcut value here

                            // Spawn a tokio task to handle the logic asynchronously
                            // This prevents blocking the shortcut handler thread
                            tokio::spawn(async move {
                                // Use the cloned shortcut value inside the async block

                                // --- Recorder Shortcut Logic ---
                                if shortcut_clone == recorder_shortcut {
                                    // Removed: if let Some(recorder_window) = ...
                                    let mut current_app_state = app_state_clone.lock().await; // Use .await

                                    match event.state() {
                                            // --- Shortcut Pressed ---
                                            ShortcutState::Pressed => {
                                                match *current_app_state {
                                                    RecorderState::Idle => {
                                                        println!("Shortcut Pressed: Idle -> Recording");
                                                        *current_app_state = RecorderState::Recording;
                                                        emit_state_change(&app_handle_clone, RecorderState::Recording);
                                                        drop(current_app_state); // Release lock before sync operations

                                                        // --- Check if main window is visible ---
                                                        let _main_window_visible = match app_handle_clone.get_webview_window("main") {
                                                            Some(main_window) => main_window.is_visible().unwrap_or(false), // Assume not visible on error
                                                            None => {
                                                                eprintln!("Main window not found during shortcut press check.");
                                                                false // Assume not visible if window doesn't exist
                                                            }
                                                        };

                                                        // Removed recorder window show/hide logic
                                                        // --- End Check ---


                                                        // Play start sound using rodio (always play)
                                                        play_sound_rodio(&app_handle_clone, "record-start.mp3");

                                                        // Reset recording flag (sync atomic)
                                                        recording_flag_clone.store(false, Ordering::SeqCst); // Ensure false before setting true

                                                        // Prepare for recording thread (sync cpal)
                                                        let host = cpal::default_host();
                                                        let device = match host.default_input_device() {
                                                            Some(d) => d,
                                                            None => {
                                                                eprintln!("Error: No input device available");
                                                                let mut state = app_state_clone.lock().await;
                                                                *state = RecorderState::Idle; // Revert state
                                                                emit_state_change(&app_handle_clone, RecorderState::Idle);
                                                                // Removed: let _ = recorder_window.hide();
                                                                return;
                                                            }
                                                        };
                                                        let config = match device.default_input_config() {
                                                            Ok(c) => c,
                                                            Err(e) => {
                                                                eprintln!("Error getting default input config: {}", e);
                                                                let mut state = app_state_clone.lock().await;
                                                                *state = RecorderState::Idle; // Revert state
                                                                emit_state_change(&app_handle_clone, RecorderState::Idle);
                                                                // Removed: let _ = recorder_window.hide();
                                                                return;
                                                            }
                                                        };

                                                        // Store config details (async lock)
                                                        let sample_format = config.sample_format();
                                                        {
                                                            let mut audio_config_guard = audio_config_clone.lock().await;
                                                            audio_config_guard.sample_rate = config.sample_rate().0;
                                                            audio_config_guard.channels = config.channels();
                                                        }

                                                        // Create channel for audio data (sync)
                                                        let (tx, rx) = unbounded::<Vec<i16>>();

                                                        // Set recording flag to true (sync atomic)
                                                        recording_flag_clone.store(true, Ordering::SeqCst);

                                                        // Spawn the synchronous recording thread (sync)
                                                        let flag_thread = recording_flag_clone.clone();
                                                        thread::spawn(move || {
                                                            println!("Recording thread started.");
                                                            if let Err(err) = audio::record_audio_stream(
                                                                flag_thread.clone(), // Pass flag
                                                                tx, // Pass sender
                                                                device,
                                                                config,
                                                                sample_format,
                                                            ) {
                                                                eprintln!("Recording error: {}", err);
                                                                // Ensure flag is reset on error
                                                                flag_thread.store(false, Ordering::SeqCst);
                                                            }
                                                            println!("Recording thread finished.");
                                                        });

                                                        // Store receiver in App state or pass differently?
                                                        // For simplicity, let's handle receiver in the release task
                                                        // We need to pass 'rx' to the release handler's task.
                                                        // This is tricky as the handler is recreated.
                                                        // Alternative: Store Option<Receiver> in AppState? Risky.
                                                        // Let's try creating the channel *outside* the handler if possible,
                                                        // or manage it via a dedicated state.
                                                        // --- Re-think: Create channel in setup, manage Sender/Receiver via state ---
                                                        // This seems overly complex. Let's stick to creating channel on press
                                                        // and passing receiver to the release task via another mechanism if needed.
                                                        // --- Simplest: Pass receiver to the tokio task spawned on release ---
                                                        // We can achieve this by storing the receiver temporarily, maybe in AppState?
                                                        // Let's try storing Option<Receiver> in AppState for now.
                                                        // **Correction:** No, AppState is shared. Cannot store receiver there easily.
                                                        // **New Approach:** Spawn the post-processing task *here* on press,
                                                        // but have it wait for the release signal (e.g., flag turning false).

                                                        // --- Spawn Post-Processing Task on PRESS ---
                                                        let app_handle_post = app_handle_clone.clone();
                                                        let audio_config_post = audio_config_clone.clone();
                                                        let app_state_post = app_state_clone.clone();
                                                        // sound_state_post clone removed
                                                        let recording_flag_post = recording_flag_clone.clone();

                                                        tokio::spawn(async move {
                                                            println!("Post-processing task spawned, waiting for recording flag...");

                                                            // Wait until recording flag is set to false
                                                            while recording_flag_post.load(Ordering::SeqCst) {
                                                                tokio::time::sleep(Duration::from_millis(50)).await;
                                                            }
                                                            println!("Post-processing task detected recording stopped.");

                                                            // --- Collect data from channel ---
                                                            let mut all_pcm_data = Vec::new();
                                                            while let Ok(chunk) = rx.try_recv() { // Use try_recv in a loop after flag is false
                                                                all_pcm_data.extend(chunk);
                                                            }
                                                            // Drain any remaining items after loop (might be needed)
                                                            while let Ok(chunk) = rx.try_recv() {
                                                                all_pcm_data.extend(chunk);
                                                            }
                                                            println!("Collected {} samples from channel.", all_pcm_data.len());

                                                            // Get config (async lock)
                                                            let audio_config_guard = audio_config_post.lock().await;
                                                            let sample_rate = audio_config_guard.sample_rate;
                                                            let channels = audio_config_guard.channels;
                                                            drop(audio_config_guard);

                                                            if all_pcm_data.is_empty() {
                                                                println!("Post-processing: Audio data is empty. Resetting state.");
                                                                let mut state = app_state_post.lock().await;
                                                                *state = RecorderState::Idle;
                                                                emit_state_change(&app_handle_post, RecorderState::Idle);
                                                                return;
                                                            }

                                                            // Create WAV data
                                                            let wav_data = match create_wav_memory(&all_pcm_data, channels, sample_rate) {
                                                                Ok(data) => data,
                                                                Err(e) => {
                                                                    eprintln!("Failed to create WAV data: {}", e);
                                                                    let mut state = app_state_post.lock().await;
                                                                    *state = RecorderState::Idle;
                                                                    emit_state_change(&app_handle_post, RecorderState::Idle);
                                                                    return;
                                                                }
                                                            };

                                                            // Calculate duration
                                                            let data_size = wav_data.len().saturating_sub(44);
                                                            let bytes_per_sample = 2u32;
                                                            let duration_secs = if sample_rate > 0 && channels > 0 {
                                                                data_size as f32 / (sample_rate * u32::from(channels) * bytes_per_sample) as f32
                                                            } else { 0.0 };
                                                            println!("Post-processing: Calculated duration: {:.2}s", duration_secs);

                                                            if duration_secs > 1.0 {
                                                                println!("Post-processing: Duration > 1s. Starting transcription.");
                                                                { // Set state to Transcribing
                                                                    let mut state = app_state_post.lock().await;
                                                                    *state = RecorderState::Transcribing;
                                                                    emit_state_change(&app_handle_post, RecorderState::Transcribing);
                                                                }

                                                                // Play end sound call removed from here

                                                println!("Sending WAV audio data to frontend for transcription. Size: {} bytes", wav_data.len());
                                                
                                                // --- Handle Main (AI Interaction) Window Directly ---
                                                if let Some(main_window) = app_handle_post.get_webview_window("main") {
                                                    println!("Found main (AI interaction) window, sending audio data...");
                                                    
                                                    // Use a separate task to avoid blocking the post-processing flow
                                                    let wav_data_clone = wav_data.clone();
                                                    tokio::spawn(async move {
                                                        // Ensure window is visible and focused before emitting
                                                        if let Err(e) = main_window.show() { eprintln!("Failed to show main window: {}", e); }
                                                        if let Err(e) = main_window.set_focus() { eprintln!("Failed to focus main window: {}", e); }
                                                        
                                                        // Create a payload with the WAV data and metadata
                                                        let payload = serde_json::json!({
                                                            "data": wav_data_clone,
                                                            "isClipboardMode": false
                                                        });
                                                        
                                                        // Send WAV data to frontend via event
                                                        if let Err(e) = main_window.emit("audio_data_available", payload) {
                                                            eprintln!("Failed to emit audio_data_available to main window: {}", e);
                                                        } else {
                                                            println!("Audio data sent to frontend successfully");
                                                        }
                                                    });
                                                } else {
                                                    eprintln!("Error: main window not found. Cannot send audio data.");
                                                    if let Err(e_emit) = app_handle_post.emit("processing_error", &serde_json::json!({ 
                                                        "stage": "audio_transfer", 
                                                        "message": "Main window not found" 
                                                    })) {
                                                        eprintln!("Failed to emit processing_error event: {}", e_emit);
                                                    }
                                                }
                                                            } else {
                                                                println!("Post-processing: Duration <= 1s. Playing end sound and resetting state.");
                                                                // Play end sound only for short recordings
                                                                play_sound_rodio(&app_handle_post, "record-end.mp3");
                                                            }

                                                            // Reset state to Idle
                                                            {
                                                                let mut state = app_state_post.lock().await;
                                                                *state = RecorderState::Idle;
                                                                emit_state_change(&app_handle_post, RecorderState::Idle);
                                                            }
                                                            println!("Post-processing task finished.");
                                                        }); // End of post-processing tokio::spawn

                                                    }
                                                    RecorderState::Recording | RecorderState::Transcribing => {
                                                        println!("Shortcut Pressed: State is {:?} (Ignoring)", *current_app_state);
                                                    }
                                                }
                                            }
                                            // --- Shortcut Released ---
                                            ShortcutState::Released => {
                                                let current_state = *current_app_state; // Read state before releasing lock
                                                drop(current_app_state); // Release lock

                                                if let RecorderState::Recording = current_state {
                                                    println!("Shortcut Released: Recording -> Processing...");

                                                    // 1. Removed recorder_window.hide() call

                                                    // 2. Play end sound call removed from here - moved to post-processing task for short recordings

                                                    // 3. Signal recording thread and post-processing task to stop (sync atomic)
                                                    println!("Setting recording flag to false.");
                                                    recording_flag_clone.store(false, Ordering::SeqCst);

                                                    // Post-processing task was already spawned on press and will detect the flag change.

                                                } else {
                                                    println!("Shortcut Released: Not in Recording state (Ignoring)");
                                                    // Removed recorder_window.hide() check and call
                                                }
                                            }
                                        }
                                    // Removed: else block for recorder_window not found
                                // --- AI Shortcut Logic ---
                                } else if shortcut_clone == ai_shortcut {
                                    if event.state() == ShortcutState::Pressed {
                                        println!("AI Shortcut (Alt+`) Pressed: Showing Main (AI Interaction) Window");
                                        if let Some(main_window) = app_handle_clone.get_webview_window("main") {
                                            // Use tokio::spawn for window operations to avoid blocking handler
                                            tokio::spawn(async move {
                                                // Position is set in config, window should be visible
                                                // if let Err(e) = main_window.move_window(Position::TopRight) { eprintln!("Failed to move main window: {}", e); }
                                                if let Err(e) = main_window.show() { eprintln!("Failed to show main window: {}", e); }
                                                if let Err(e) = main_window.set_focus() { eprintln!("Failed to focus main window: {}", e); }
                                            });
                                        } else {
                                            eprintln!("Main (AI Interaction) window not found in shortcut handler.");
                                        }
                                    }
                                    // No specific action needed on release for the AI shortcut
                                }
                                // --- Clipboard Shortcut Logic ---
                                else if shortcut_clone == clipboard_shortcut {
                                    // Removed: if let Some(recorder_window) = ...
                                    let mut current_app_state = app_state_clone.lock().await; // Use .await

                                    match event.state() {
                                            // --- Shortcut Pressed ---
                                            ShortcutState::Pressed => {
                                                match *current_app_state {
                                                    RecorderState::Idle => {
                                                        println!("Clipboard Shortcut Pressed: Idle -> Recording");
                                                        *current_app_state = RecorderState::Recording;
                                                        emit_state_change(&app_handle_clone, RecorderState::Recording);
                                                        drop(current_app_state); // Release lock before sync operations

                                                        // Removed recorder window show/focus logic

                                                        // Play start sound using rodio (always play)
                                                        play_sound_rodio(&app_handle_clone, "record-start.mp3");

                                                        // Reset recording flag (sync atomic)
                                                        recording_flag_clone.store(false, Ordering::SeqCst); // Ensure false before setting true

                                                        // Prepare for recording thread (sync cpal)
                                                        let host = cpal::default_host();
                                                        let device = match host.default_input_device() {
                                                            Some(d) => d,
                                                            None => {
                                                                eprintln!("Error: No input device available");
                                                                let mut state = app_state_clone.lock().await;
                                                                *state = RecorderState::Idle; // Revert state
                                                                emit_state_change(&app_handle_clone, RecorderState::Idle);
                                                                // Removed: let _ = recorder_window.hide();
                                                                return;
                                                            }
                                                        };
                                                        let config = match device.default_input_config() {
                                                            Ok(c) => c,
                                                            Err(e) => {
                                                                eprintln!("Error getting default input config: {}", e);
                                                                let mut state = app_state_clone.lock().await;
                                                                *state = RecorderState::Idle; // Revert state
                                                                emit_state_change(&app_handle_clone, RecorderState::Idle);
                                                                // Removed: let _ = recorder_window.hide();
                                                                return;
                                                            }
                                                        };

                                                        // Store config details (async lock)
                                                        let sample_format = config.sample_format();
                                                        {
                                                            let mut audio_config_guard = audio_config_clone.lock().await;
                                                            audio_config_guard.sample_rate = config.sample_rate().0;
                                                            audio_config_guard.channels = config.channels();
                                                        }

                                                        // Create channel for audio data (sync)
                                                        let (tx, rx) = unbounded::<Vec<i16>>();

                                                        // Set recording flag to true (sync atomic)
                                                        recording_flag_clone.store(true, Ordering::SeqCst);

                                                        // Spawn the synchronous recording thread (sync)
                                                        let flag_thread = recording_flag_clone.clone();
                                                        thread::spawn(move || {
                                                            println!("Recording thread started for clipboard.");
                                                            if let Err(err) = audio::record_audio_stream(
                                                                flag_thread.clone(), // Pass flag
                                                                tx, // Pass sender
                                                                device,
                                                                config,
                                                                sample_format,
                                                            ) {
                                                                eprintln!("Recording error: {}", err);
                                                                // Ensure flag is reset on error
                                                                flag_thread.store(false, Ordering::SeqCst);
                                                            }
                                                            println!("Recording thread finished for clipboard.");
                                                        });

                                                        // --- Spawn Post-Processing Task on PRESS ---
                                                        let app_handle_post = app_handle_clone.clone();
                                                        let audio_config_post = audio_config_clone.clone();
                                                        let app_state_post = app_state_clone.clone();
                                                        let recording_flag_post = recording_flag_clone.clone();

                                                        tokio::spawn(async move {
                                                            println!("Clipboard post-processing task spawned, waiting for recording flag...");

                                                            // Wait until recording flag is set to false
                                                            while recording_flag_post.load(Ordering::SeqCst) {
                                                                tokio::time::sleep(Duration::from_millis(50)).await;
                                                            }
                                                            println!("Clipboard post-processing task detected recording stopped.");

                                                            // --- Collect data from channel ---
                                                            let mut all_pcm_data = Vec::new();
                                                            while let Ok(chunk) = rx.try_recv() { // Use try_recv in a loop after flag is false
                                                                all_pcm_data.extend(chunk);
                                                            }
                                                            // Drain any remaining items after loop (might be needed)
                                                            while let Ok(chunk) = rx.try_recv() {
                                                                all_pcm_data.extend(chunk);
                                                            }
                                                            println!("Collected {} samples from channel for clipboard.", all_pcm_data.len());

                                                            // Get config (async lock)
                                                            let audio_config_guard = audio_config_post.lock().await;
                                                            let sample_rate = audio_config_guard.sample_rate;
                                                            let channels = audio_config_guard.channels;
                                                            drop(audio_config_guard);

                                                            if all_pcm_data.is_empty() {
                                                                println!("Clipboard post-processing: Audio data is empty. Resetting state.");
                                                                let mut state = app_state_post.lock().await;
                                                                *state = RecorderState::Idle;
                                                                emit_state_change(&app_handle_post, RecorderState::Idle);
                                                                return;
                                                            }

                                                            // Create WAV data
                                                            let wav_data = match create_wav_memory(&all_pcm_data, channels, sample_rate) {
                                                                Ok(data) => data,
                                                                Err(e) => {
                                                                    eprintln!("Failed to create WAV data for clipboard: {}", e);
                                                                    let mut state = app_state_post.lock().await;
                                                                    *state = RecorderState::Idle;
                                                                    emit_state_change(&app_handle_post, RecorderState::Idle);
                                                                    return;
                                                                }
                                                            };

                                                            // Calculate duration
                                                            let data_size = wav_data.len().saturating_sub(44);
                                                            let bytes_per_sample = 2u32;
                                                            let duration_secs = if sample_rate > 0 && channels > 0 {
                                                                data_size as f32 / (sample_rate * u32::from(channels) * bytes_per_sample) as f32
                                                            } else { 0.0 };
                                                            println!("Clipboard post-processing: Calculated duration: {:.2}s", duration_secs);

                                                            if duration_secs > 1.0 {
                                                                println!("Clipboard post-processing: Duration > 1s. Starting transcription.");
                                                                { // Set state to Transcribing
                                                                    let mut state = app_state_post.lock().await;
                                                                    *state = RecorderState::Transcribing;
                                                                    emit_state_change(&app_handle_post, RecorderState::Transcribing);
                                                                }

                                                                // Instead of handling transcription in the backend,
                                                                // send the WAV data to the frontend with metadata indicating clipboard mode
                                                                println!("Sending clipboard WAV audio data to frontend. Size: {} bytes", wav_data.len());
                                                                
                                                                // --- Handle Main (AI Interaction) Window ---
                                                                if let Some(main_window) = app_handle_post.get_webview_window("main") {
                                                                    println!("Found main window, sending audio data for clipboard operation...");
                                                                    
                                                                    // Create a payload with the WAV data and metadata
                                                                    let payload = serde_json::json!({
                                                                        "data": wav_data,
                                                                        "isClipboardMode": true
                                                                    });
                                                                    
                                                                    // Use a separate task to avoid blocking the post-processing flow
                                                                    tokio::spawn(async move {
                                                                        // Send WAV data to frontend via event with clipboard mode flag
                                                                        if let Err(e) = main_window.emit("audio_data_available", payload) {
                                                                            eprintln!("Failed to emit audio_data_available to main window: {}", e);
                                                                        } else {
                                                                            println!("Audio data with clipboard flag sent to frontend");
                                                                        }
                                                                    });
                                                                } else {
                                                                    eprintln!("Error: main window not found. Cannot send audio data for clipboard.");
                                                                    if let Err(e_emit) = app_handle_post.emit("processing_error", &serde_json::json!({ 
                                                                        "stage": "audio_transfer", 
                                                                        "message": "Main window not found" 
                                                                    })) {
                                                                        eprintln!("Failed to emit processing_error event: {}", e_emit);
                                                                    }
                                                                }
                                                            } else {
                                                                println!("Clipboard post-processing: Duration <= 1s. Playing end sound and resetting state.");
                                                                // Play end sound only for short recordings
                                                                play_sound_rodio(&app_handle_post, "record-end.mp3");
                                                            }

                                                            // Reset state to Idle
                                                            {
                                                                let mut state = app_state_post.lock().await;
                                                                *state = RecorderState::Idle;
                                                                emit_state_change(&app_handle_post, RecorderState::Idle);
                                                            }
                                                            println!("Clipboard post-processing task finished.");
                                                        }); // End of post-processing tokio::spawn
                                                    }
                                                    RecorderState::Recording | RecorderState::Transcribing => {
                                                        println!("Clipboard Shortcut Pressed: State is {:?} (Ignoring)", *current_app_state);
                                                    }
                                                }
                                            }
                                            // --- Shortcut Released ---
                                            ShortcutState::Released => {
                                                let current_state = *current_app_state; // Read state before releasing lock
                                                drop(current_app_state); // Release lock

                                                if let RecorderState::Recording = current_state {
                                                    println!("Clipboard Shortcut Released: Recording -> Processing...");

                                                    // 1. Removed recorder_window.hide() call

                                                    // 2. Signal recording thread and post-processing task to stop (sync atomic)
                                                    println!("Setting recording flag to false for clipboard.");
                                                    recording_flag_clone.store(false, Ordering::SeqCst);

                                                    // Post-processing task was already spawned on press and will detect the flag change.
                                                } else {
                                                    println!("Clipboard Shortcut Released: Not in Recording state (Ignoring)");
                                                    // Removed recorder_window.hide() check and call
                                                }
                                            }
                                        }
                                    // Removed: else block for recorder_window not found
                                }
                            }); // End of outer tokio::spawn for handler logic
                        }) // End of with_handler closure
                        .build(),
                )?;

                // Register the shortcuts
                let shortcut_manager = app.global_shortcut();
                if let Err(e) = shortcut_manager.register(recorder_shortcut.clone()) {
                    eprintln!("Failed to register recorder shortcut (Meta+`): {}", e);
                } else {
                    println!("Recorder shortcut (Meta+`) registered successfully.");
                }
                if let Err(e) = shortcut_manager.register(ai_shortcut.clone()) {
                    eprintln!("Failed to register AI shortcut (Alt+`): {}", e);
                } else {
                    println!("AI shortcut (Alt+`) registered successfully.");
                }
                if let Err(e) = shortcut_manager.register(clipboard_shortcut.clone()) {
                    eprintln!("Failed to register clipboard shortcut (Ctrl+`): {}", e);
                } else {
                    println!("Clipboard shortcut (Ctrl+`) registered successfully.");
                }
            }
            Ok(())
        })
        .build(tauri::generate_context!()) // Use build instead of run for async setup
        .expect("error while building tauri application")
        .run(|_app_handle, event| match event { // Use run loop for async runtime
            tauri::RunEvent::ExitRequested { .. } => {
                // Allow the app to exit naturally when requested,
                // including when triggered by app.exit(0) from the tray menu.
                println!("Exit requested, allowing exit.");
            }
            _ => {}
        });
}
