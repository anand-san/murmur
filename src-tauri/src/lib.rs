// Declare modules
mod audio;
mod state;

// Use necessary items from modules and external crates
use base64::{engine::general_purpose, Engine as _};
use cpal::traits::{DeviceTrait, HostTrait}; // StreamTrait not needed directly here anymore
use state::{AppStateRef, AudioState, AudioStateRef, RecorderState}; // Import state types
use std::thread;
use std::time::Duration;
use tauri::Manager;
use tauri::Emitter;
use tauri_plugin_positioner::{Position, WindowExt};

// --- Tauri Commands ---

/// Record audio from the default input device and store in memory
#[tauri::command]
fn start_recording(state: tauri::State<'_, AudioStateRef>) -> Result<(), String> {
    let mut audio_state = state.lock().map_err(|e| e.to_string())?;

    if audio_state.is_recording {
        println!("Warning: start_recording called while already recording.");
        return Err("Recording is already in progress".to_string());
    }

    audio_state.audio_data = Some(Vec::new());
    audio_state.is_recording = true;

    let host = cpal::default_host();
    let device = host
        .default_input_device()
        .ok_or_else(|| "No input device available".to_string())?;
    let config = device
        .default_input_config()
        .map_err(|e| format!("Error getting default input config: {}", e))?;

    // Store config details in state before releasing lock
    audio_state.sample_rate = config.sample_rate().0;
    audio_state.channels = config.channels();
    let sample_format = config.sample_format(); // Get format before config is moved

    drop(audio_state); // Release lock before spawning thread

    let state_ref = state.inner().clone();
    // Spawn thread to run the audio recording function from the audio module
    thread::spawn(move || {
        println!("Recording thread started.");
        // Call the function from the audio module
        if let Err(err) = audio::record_to_memory(state_ref.clone(), device, config, sample_format)
        {
            eprintln!("Recording error: {}", err);
            // Ensure flag is reset on error
            if let Ok(mut state_guard) = state_ref.lock() {
                state_guard.is_recording = false;
            }
        }
        println!("Recording thread finished.");
    });

    Ok(())
}

/// Stop recording audio
#[tauri::command]
fn stop_recording(state: tauri::State<'_, AudioStateRef>) -> Result<(), String> {
    let mut audio_state = state.lock().map_err(|e| e.to_string())?;

    if !audio_state.is_recording {
        println!("Warning: stop_recording called but not in recording state.");
        return Ok(());
    }

    println!("Setting is_recording flag to false.");
    audio_state.is_recording = false;

    Ok(())
}

/// Get recorded audio as base64 string for playback in frontend
#[tauri::command]
fn get_audio_data(state: tauri::State<'_, AudioStateRef>) -> Result<String, String> {
    let audio_state = state.lock().map_err(|e| e.to_string())?;
    let audio_data = audio_state
        .audio_data
        .as_ref()
        .ok_or_else(|| "No recording available or recording failed".to_string())?;

    if audio_data.is_empty() {
        return Err("Recorded audio data is empty.".to_string());
    }
    let base64 = general_purpose::STANDARD.encode(audio_data);
    Ok(base64)
}

/// Play the recorded audio in the backend (Optional)
#[tauri::command]
fn play_audio(state: tauri::State<'_, AudioStateRef>) -> Result<(), String> {
    // Clone the audio data out of the mutex guard's scope
    let audio_data_clone = {
        let audio_state = state.lock().map_err(|e| e.to_string())?;
        audio_state
            .audio_data
            .as_ref()
            .cloned()
            .ok_or_else(|| "No recording available".to_string())?
    }; // Mutex guard dropped here

    if audio_data_clone.is_empty() {
        return Err("Cannot play empty audio data.".to_string());
    }

    // Spawn thread to run the playback function from the audio module
    thread::spawn(move || {
        // Call the function from the audio module
        if let Err(err) = audio::play_audio_from_memory(&audio_data_clone) {
            eprintln!("Error playing audio: {}", err);
        }
    });
    Ok(())
}

/// Hide the main window (if used)
#[tauri::command]
fn hide_window(window: tauri::AppHandle) -> Result<(), String> {
    window
        .get_webview_window("main")
        .ok_or_else(|| "Main window not found".to_string())?
        .hide()
        .map_err(|e| e.to_string())
}

/// Handles request from frontend to close the recorder window and reset state.
#[tauri::command]
fn request_close_recorder(
    app_handle: tauri::AppHandle,
    audio_state_ref: tauri::State<'_, AudioStateRef>,
    app_state_ref: tauri::State<'_, AppStateRef>,
) -> Result<(), String> {
    println!("Executing request_close_recorder command...");

    // 1. Reset AudioState
    {
        let mut audio_state = audio_state_ref
            .lock()
            .map_err(|e| format!("Failed to lock AudioState: {}", e))?;
        audio_state.is_recording = false;
        audio_state.audio_data = None;
        println!("Audio state reset.");
    }

    // 2. Reset AppState
    {
        let mut app_state = app_state_ref
            .lock()
            .map_err(|e| format!("Failed to lock AppState: {}", e))?;
        *app_state = RecorderState::Idle; // Use enum from state module
        println!("App state reset to Idle.");
    }

    // 3. Hide the recorder window
    if let Some(window) = app_handle.get_webview_window("recorder") {
        println!("Hiding recorder window.");
        window
            .hide()
            .map_err(|e| format!("Failed to hide recorder window: {}", e))?;
    } else {
        eprintln!("Recorder window not found during request_close_recorder.");
    }

    Ok(())
}

/// Show the main window (if used)
#[tauri::command]
fn show_window(window: tauri::AppHandle) -> Result<(), String> {
    window
        .get_webview_window("main")
        .ok_or_else(|| "Main window not found".to_string())?
        .show()
        .map_err(|e| e.to_string())
}

// --- Application Entry Point ---

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Use the constructor from the state module
    let audio_state = AudioStateRef::new(std::sync::Mutex::new(AudioState::new()));
    let app_state = AppStateRef::new(std::sync::Mutex::new(RecorderState::Idle));

    tauri::Builder::default()
        .plugin(tauri_plugin_positioner::init())
        .invoke_handler(tauri::generate_handler![
            // Commands remain the same, their implementation details changed
            hide_window,
            show_window,
            start_recording,
            stop_recording,
            get_audio_data,
            play_audio,
            request_close_recorder
        ])
        .manage(audio_state.clone()) // Manage state using imported types
        .manage(app_state.clone())
        .setup(move |app| {
            // Setup logic remains largely the same, using imported state types
            #[cfg(desktop)]
            {
                use tauri_plugin_global_shortcut::{
                    Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState,
                };

                let shortcut_key = Shortcut::new(Some(Modifiers::SHIFT), Code::Backquote);

                if let Some(recorder_window) = app.get_webview_window("recorder") {
                    let _ = recorder_window.move_window(Position::TopRight);
                    let _ = recorder_window.hide();

                    let app_handle_listener = app.handle().clone();
                    recorder_window.on_window_event(move |event| {
                        if let tauri::WindowEvent::CloseRequested { .. } = event {
                            println!("Window Close Requested (OS event)");
                            {
                                let app_state_listener_handle =
                                    app_handle_listener.state::<AppStateRef>(); // Use imported type
                                if let Ok(mut state) = app_state_listener_handle.lock() {
                                    *state = RecorderState::Idle; // Use imported enum variant
                                    println!("App state reset to Idle due to OS close event");
                                } else {
                                    eprintln!(
                                        "Failed to lock AppState in OS close event listener"
                                    );
                                };
                            }
                        }
                    });
                } else {
                    eprintln!("Failed to get recorder window during setup.");
                }

                app.handle().plugin(
                    tauri_plugin_global_shortcut::Builder::new()
                        .with_handler({
                            let audio_state_handler = audio_state.clone();
                            let app_state_handler = app_state.clone();

                            move |app, shortcut, event| {
                                if shortcut == &shortcut_key {
                                    if let Some(recorder_window) =
                                        app.get_webview_window("recorder")
                                    {
                                        let mut current_app_state =
                                            app_state_handler.lock().unwrap();

                                        match event.state() {
                                            ShortcutState::Pressed => {
                                                match *current_app_state {
                                                    RecorderState::Idle => { // Use imported enum variant
                                                        println!("Shortcut Pressed: Idle -> Recording");
                                                        let _ = recorder_window.show();
                                                        let _ = recorder_window.set_focus();
                                                        {
                                                            let mut audio_state_guard =
                                                                audio_state_handler.lock().unwrap();
                                                            audio_state_guard.is_recording = false;
                                                            audio_state_guard.audio_data = None;
                                                            println!(
                                                                "Pre-recording audio state reset."
                                                            );
                                                        }
                                                        // Call start_recording command
                                                        match start_recording(
                                                            app.state::<AudioStateRef>(), // Use imported type
                                                        ) {
                                                            Ok(_) => {
                                                                *current_app_state =
                                                                    RecorderState::Recording; // Use imported enum variant
                                                                let _ = recorder_window.emit(
                                                                    "recording-event",
                                                                    serde_json::json!({
                                                                        "type": "started"
                                                                    }),
                                                                );
                                                            }
                                                            Err(e) => {
                                                                eprintln!(
                                                                    "Failed to start recording via command: {}",
                                                                    e
                                                                );
                                                                let _ = recorder_window.hide();
                                                                *current_app_state =
                                                                    RecorderState::Idle; // Use imported enum variant
                                                            }
                                                        }
                                                    }
                                                    RecorderState::Recording => { // Use imported enum variant
                                                        println!(
                                                            "Shortcut Pressed: Recording (Ignoring)"
                                                        );
                                                    }
                                                    RecorderState::Processed => { // Use imported enum variant
                                                        println!("Shortcut Pressed: Processed -> Idle (Closing Window)");
                                                        let _ = recorder_window.hide();
                                                        {
                                                            let mut audio_state_guard =
                                                                audio_state_handler.lock().unwrap();
                                                            audio_state_guard.is_recording = false;
                                                            audio_state_guard.audio_data = None;
                                                        }
                                                        *current_app_state = RecorderState::Idle; // Use imported enum variant
                                                        println!("States reset manually on close from Processed state.");
                                                    }
                                                }
                                            }
                                            ShortcutState::Released => {
                                                if let RecorderState::Recording = *current_app_state { // Use imported enum variant
                                                    println!(
                                                        "Shortcut Released: Recording -> Processed"
                                                    );
                                                    // Call stop_recording command
                                                    match stop_recording(
                                                        app.state::<AudioStateRef>(), // Use imported type
                                                    ) {
                                                        Ok(_) => {
                                                            *current_app_state =
                                                                RecorderState::Processed; // Use imported enum variant
                                                            let _ = recorder_window.emit(
                                                                "recording-event",
                                                                serde_json::json!({
                                                                    "type": "stopped"
                                                                }),
                                                            );

                                                            let window_clone =
                                                                recorder_window.clone();
                                                            thread::spawn(move || {
                                                                thread::sleep(Duration::from_millis(
                                                                    250,
                                                                )); // Wait for WAV finalization
                                                                println!(
                                                                    "Emitting ready-to-fetch event."
                                                                );
                                                                let _ = window_clone.emit(
                                                                    "recording-event",
                                                                    serde_json::json!({
                                                                        "type": "ready-to-fetch"
                                                                    }),
                                                                );
                                                            });
                                                        }
                                                        Err(e) => {
                                                            eprintln!(
                                                                "Failed to stop recording via command: {}",
                                                                e
                                                            );
                                                            *current_app_state =
                                                                RecorderState::Idle; // Reset on error
                                                            let _ = recorder_window.hide();
                                                        }
                                                    }
                                                } else {
                                                    println!("Shortcut Released: Not in Recording state (Ignoring)");
                                                }
                                            }
                                        }
                                    } else {
                                        eprintln!("Recorder window not found in shortcut handler.");
                                    }
                                }
                            }
                        })
                        .build(),
                )?;

                if let Err(e) = app.global_shortcut().register(shortcut_key) {
                    eprintln!("Failed to register global shortcut: {}", e);
                } else {
                    println!("Global shortcut (Shift+`) registered successfully.");
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
