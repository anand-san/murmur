mod audio;
mod screenshot;
mod state;

use cpal::traits::{DeviceTrait, HostTrait};
use crossbeam_channel::unbounded;
use rodio::Sink;
use serde_json::json;
use state::{AppStateRef, AudioConfig, AudioConfigRef, RecorderState, RecordingFlag};
use std::fs::File;
use std::io::BufReader;
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;
use std::time::Duration;
use tauri::menu::{MenuBuilder, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::Manager;
use tauri::{path::BaseDirectory, Emitter};
use tauri_plugin_positioner::{Position, WindowExt};
use tauri_plugin_store::StoreExt;

fn emit_state_change(app_handle: &tauri::AppHandle, new_state: RecorderState) {
    println!("Emitting state change: {:?}", new_state);
    if let Err(e) = app_handle.emit("state_changed", &new_state) {
        eprintln!("Failed to emit state_changed event: {}", e);
    }
}

fn create_wav_memory(pcm_data: &[i16], channels: u16, sample_rate: u32) -> Result<Vec<u8>, String> {
    let bits_per_sample: u16 = 16;
    let bytes_per_sample = bits_per_sample / 8;
    let block_align = channels * bytes_per_sample;
    let byte_rate = sample_rate * u32::from(block_align);

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

    wav_data.extend_from_slice(b"RIFF");
    wav_data.extend_from_slice(&file_size.to_le_bytes());
    wav_data.extend_from_slice(b"WAVE");
    wav_data.extend_from_slice(b"fmt ");
    wav_data.extend_from_slice(&16u32.to_le_bytes());
    wav_data.extend_from_slice(&1u16.to_le_bytes());
    wav_data.extend_from_slice(&channels.to_le_bytes());
    wav_data.extend_from_slice(&sample_rate.to_le_bytes());
    wav_data.extend_from_slice(&byte_rate.to_le_bytes());
    wav_data.extend_from_slice(&block_align.to_le_bytes());
    wav_data.extend_from_slice(&bits_per_sample.to_le_bytes());
    wav_data.extend_from_slice(b"data");
    wav_data.extend_from_slice(&data_size.to_le_bytes());
    wav_data.extend_from_slice(&pcm_data_bytes);

    Ok(wav_data)
}

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

    thread::spawn(move || match rodio::OutputStream::try_default() {
        Ok((_stream, stream_handle)) => match File::open(&sound_path) {
            Ok(file) => {
                let file = BufReader::new(file);
                match rodio::Decoder::new(file) {
                    Ok(source) => {
                        let sink = Sink::try_new(&stream_handle).unwrap();
                        sink.set_volume(0.5);
                        sink.append(source);
                        sink.sleep_until_end();
                        println!("Played sound: {:?}", sound_path);
                    }
                    Err(e) => {
                        eprintln!("Error decoding sound file {:?}: {}", sound_path, e)
                    }
                }
            }
            Err(e) => eprintln!("Error opening sound file {:?}: {}", sound_path, e),
        },
        Err(e) => eprintln!("Error getting default audio output stream: {}", e),
    });
}

#[tauri::command]
fn hide_window(window: tauri::AppHandle) -> Result<(), String> {
    window
        .get_webview_window("main")
        .ok_or_else(|| "Main window not found".to_string())?
        .hide()
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn show_window(window: tauri::AppHandle) -> Result<(), String> {
    window
        .get_webview_window("main")
        .ok_or_else(|| "Main window not found".to_string())?
        .show()
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn perform_clipboard_paste(text: String, app_handle: tauri::AppHandle) -> Result<(), String> {
    println!(
        "Executing perform_clipboard_paste command for text: '{}'",
        text
    );

    use tauri_plugin_clipboard_manager::ClipboardExt;
    let previous_clipboard = app_handle.clipboard().read_text().unwrap_or_default();
    println!("Saved current clipboard content");

    if let Err(e) = app_handle.clipboard().write_text(text.clone()) {
        return Err(format!("Failed to write to clipboard: {}", e));
    }
    println!("Text successfully copied to clipboard");

    tokio::time::sleep(tokio::time::Duration::from_millis(20)).await;

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
                        println!(
                            "osascript stdout: {}",
                            String::from_utf8_lossy(&output.stdout)
                        );
                    }
                } else {
                    eprintln!(
                        "AppleScript paste command failed with status: {:?}",
                        output.status
                    );
                    if !output.stderr.is_empty() {
                        eprintln!(
                            "osascript stderr: {}",
                            String::from_utf8_lossy(&output.stderr)
                        );
                    }
                    return Err(format!("AppleScript execution failed: {:?}", output.status));
                }
            }
            Err(e) => {
                eprintln!(
                    "Failed to execute osascript for paste using shell plugin: {}",
                    e
                );
                return Err(format!("Failed to execute AppleScript: {}", e));
            }
        }
    }
    #[cfg(not(target_os = "macos"))]
    {
        println!("Automatic paste via script not supported on this OS.");
    }

    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

    if let Err(e) = app_handle.clipboard().write_text(previous_clipboard) {
        eprintln!("Failed to restore clipboard: {}", e);
        return Err(format!("Failed to restore clipboard: {}", e));
    }
    println!("Original clipboard content restored after paste and delay");
    Ok(())
}

#[tauri::command]
async fn check_microphone_permission() -> Result<String, String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;

        // Try to check microphone permission using tccutil
        let exe_name = std::env::current_exe()
            .ok()
            .and_then(|p| p.file_name().map(|n| n.to_string_lossy().to_string()))
            .unwrap_or_else(|| "murmur".to_string());

        let query = format!(
            "SELECT allowed FROM access WHERE service='kTCCServiceMicrophone' AND client='{}';",
            exe_name
        );
        let output = Command::new("sqlite3")
            .args(["/Library/Application Support/com.apple.TCC/TCC.db", &query])
            .output();

        match output {
            Ok(result) if result.status.success() => {
                let output_str = String::from_utf8_lossy(&result.stdout);
                let response = output_str.trim();
                match response {
                    "1" => Ok("granted".to_string()),
                    "0" => Ok("denied".to_string()),
                    _ => {
                        // If no entry found in TCC db, try alternative method
                        check_microphone_via_audio_test().await
                    }
                }
            }
            _ => {
                // Fallback to audio device test
                check_microphone_via_audio_test().await
            }
        }
    }
    #[cfg(not(target_os = "macos"))]
    {
        // For non-macOS platforms, try to test audio access directly
        check_microphone_via_audio_test().await
    }
}

async fn check_microphone_via_audio_test() -> Result<String, String> {
    use cpal::traits::HostTrait;

    // Try to get default input device - this is usually a good indicator
    let host = cpal::default_host();
    match host.default_input_device() {
        Some(device) => {
            // Try to get supported configs - this might trigger permission request
            match device.supported_input_configs() {
                Ok(mut configs) => {
                    if configs.next().is_some() {
                        Ok("granted".to_string())
                    } else {
                        Ok("unknown".to_string())
                    }
                }
                Err(_) => Ok("denied".to_string()),
            }
        }
        None => Ok("denied".to_string()),
    }
}

#[tauri::command]
async fn request_microphone_permission() -> Result<bool, String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;

        // On macOS, we can try to trigger permission dialog by attempting to access microphone
        // This is a simplified approach - in practice, the permission request happens when
        // the app first tries to access the microphone
        let output = Command::new("osascript")
            .args(["-e", r#"
                tell application "System Preferences"
                    activate
                    set current pane to pane "com.apple.preference.security"
                    delay 1
                    tell application "System Events"
                        tell process "System Preferences"
                            click button "Privacy" of tab group 1 of window 1
                            delay 0.5
                            select row (first row of outline 1 of scroll area 1 of tab group 1 of window 1 whose value of static text 1 is "Microphone")
                        end tell
                    end tell
                end tell
            "#])
            .output()
            .map_err(|e| format!("Failed to open microphone settings: {}", e))?;

        if output.status.success() {
            Ok(true)
        } else {
            Err("Failed to open microphone privacy settings".to_string())
        }
    }
    #[cfg(not(target_os = "macos"))]
    {
        Err("Permission request not supported on this platform".to_string())
    }
}

#[tauri::command]
async fn check_accessibility_permission() -> Result<String, String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;

        let output = Command::new("osascript")
            .args([
                "-e",
                r#"
                tell application "System Events"
                    try
                        get name of every process
                        return "granted"
                    on error
                        return "denied"
                    end try
                end tell
            "#,
            ])
            .output()
            .map_err(|e| format!("Failed to check accessibility permission: {}", e))?;

        if output.status.success() {
            let output_str = String::from_utf8_lossy(&output.stdout);
            let result = output_str.trim();
            if result == "granted" {
                Ok("granted".to_string())
            } else if result == "denied" {
                Ok("denied".to_string())
            } else {
                Ok("unknown".to_string())
            }
        } else {
            Ok("denied".to_string())
        }
    }
    #[cfg(not(target_os = "macos"))]
    {
        Ok("unknown".to_string())
    }
}

#[tauri::command]
async fn request_accessibility_permission() -> Result<bool, String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;

        let output = Command::new("osascript")
            .args(["-e", r#"
                tell application "System Preferences"
                    activate
                    set current pane to pane "com.apple.preference.security"
                    delay 1
                    tell application "System Events"
                        tell process "System Preferences"
                            click button "Privacy" of tab group 1 of window 1
                            delay 0.5
                            select row (first row of outline 1 of scroll area 1 of tab group 1 of window 1 whose value of static text 1 is "Accessibility")
                        end tell
                    end tell
                end tell
            "#])
            .output()
            .map_err(|e| format!("Failed to open accessibility settings: {}", e))?;

        if output.status.success() {
            Ok(true)
        } else {
            Err("Failed to open accessibility privacy settings".to_string())
        }
    }
    #[cfg(not(target_os = "macos"))]
    {
        Err("Permission request not supported on this platform".to_string())
    }
}

#[tauri::command]
async fn test_backend_connection(url: String) -> Result<String, String> {
    use std::time::Duration;

    // Basic URL validation
    if url.is_empty() {
        return Err("URL cannot be empty".to_string());
    }

    // Try to parse the URL
    match url::Url::parse(&url) {
        Ok(parsed_url) => {
            // For HTTP URLs, try a simple GET request to test connectivity
            if parsed_url.scheme() == "http" || parsed_url.scheme() == "https" {
                let client = reqwest::Client::builder()
                    .timeout(Duration::from_secs(5))
                    .build()
                    .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

                match client.get(&url).send().await {
                    Ok(response) => {
                        if response.status().is_success() {
                            Ok("connected".to_string())
                        } else {
                            Ok(format!("server_error_{}", response.status().as_u16()))
                        }
                    }
                    Err(e) => {
                        if e.is_timeout() {
                            Ok("timeout".to_string())
                        } else if e.is_connect() {
                            Ok("connection_failed".to_string())
                        } else {
                            Ok("network_error".to_string())
                        }
                    }
                }
            } else {
                Err(format!("Unsupported URL scheme: {}", parsed_url.scheme()))
            }
        }
        Err(_) => Err("Invalid URL format".to_string()),
    }
}

#[derive(serde::Serialize)]
struct AudioDevice {
    id: String,
    name: String,
    is_default: bool,
}

#[tauri::command]
async fn get_audio_input_devices() -> Result<Vec<AudioDevice>, String> {
    use cpal::traits::{DeviceTrait, HostTrait};

    let host = cpal::default_host();
    let default_device = host.default_input_device();
    let default_name = default_device
        .as_ref()
        .and_then(|d| d.name().ok())
        .unwrap_or_default();

    let devices = host
        .input_devices()
        .map_err(|e| format!("Failed to enumerate input devices: {}", e))?;

    let mut audio_devices = Vec::new();

    for device in devices {
        if let Ok(name) = device.name() {
            let device_id = format!("device_{}", audio_devices.len());
            audio_devices.push(AudioDevice {
                id: device_id,
                name: name.clone(),
                is_default: name == default_name,
            });
        }
    }

    Ok(audio_devices)
}

#[tauri::command]
async fn get_selected_audio_device() -> Result<String, String> {
    // For now, return the default device
    // In a more complete implementation, this would read from settings
    use cpal::traits::{DeviceTrait, HostTrait};

    let host = cpal::default_host();
    match host.default_input_device() {
        Some(device) => device
            .name()
            .map_err(|e| format!("Failed to get device name: {}", e)),
        None => Err("No default input device found".to_string()),
    }
}

#[tauri::command]
async fn set_selected_audio_device(device_name: String) -> Result<(), String> {
    // For now, this is a placeholder
    // In a more complete implementation, this would:
    // 1. Validate the device exists
    // 2. Store the selection in settings
    // 3. Update the audio recording to use the selected device

    println!("Selected audio device: {}", device_name);
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
#[tokio::main]
pub async fn run() {
    let audio_config = AudioConfigRef::new(tokio::sync::Mutex::new(AudioConfig::new()));
    let app_state = AppStateRef::new(tokio::sync::Mutex::new(RecorderState::Idle));
    let recording_flag = RecordingFlag::new(AtomicBool::new(false));

    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_positioner::init())
        .invoke_handler(tauri::generate_handler![
            hide_window,
            show_window,
            perform_clipboard_paste,
            screenshot::capture_screenshot,
            check_microphone_permission,
            request_microphone_permission,
            check_accessibility_permission,
            request_accessibility_permission,
            test_backend_connection,
            get_audio_input_devices,
            get_selected_audio_device,
            set_selected_audio_device
        ])
        .manage(audio_config.clone())
        .manage(app_state.clone())
        .manage(recording_flag.clone())
        .setup(move |app| {
            // ---- BEGIN STORE SETUP ----
            let store_file_name = "settings.json";
            match app.store(store_file_name) {
                Ok(store) => {
                    let use_local_mode_key = "use_local_mode";
                    let backend_url_key = "backend_url";
                    let mut defaults_were_set = false;

                    // Set default for use_local_mode if not present
                    // Set default for use_local_mode if not present
                    if !store.has(use_local_mode_key) { // Corrected: store.has directly returns bool
                        // Assuming store.set() panics on error or returns () based on persistent compiler errors
                        store.set(use_local_mode_key, json!(false));
                        println!("[STORE] Initialized '{}' to false in {}", use_local_mode_key, store_file_name);
                        defaults_were_set = true;
                        // If store.set can error and doesn't panic, this approach will miss handling it.
                        // However, compiler insists the expression is type () in match.
                    }

                    // Set default for backend_url if not present
                    if !store.has(backend_url_key) { // Corrected: store.has directly returns bool
                        // Assuming store.set() panics on error or returns ()
                        store.set(backend_url_key, json!("http://localhost:5555/api"));
                        println!("[STORE] Initialized '{}' to 'http://localhost:5555/api' in {}", backend_url_key, store_file_name);
                        defaults_were_set = true;
                    }

                    if defaults_were_set {
                        if let Err(e) = store.save() {
                            eprintln!("[STORE] Error saving store after setting defaults: {}", e);
                        } else {
                            println!("[STORE] Settings saved to {} after initializing defaults.", store_file_name);
                        }
                    }
                }
                Err(e) => {
                    eprintln!("[STORE] CRITICAL: Failed to load or create store '{}': {}. Store functionality will be impaired.", store_file_name, e);
                    // Depending on how critical the store is, you might want to return an Err here
                    // return Err(Box::new(e) as Box<dyn std::error::Error + Send + Sync + 'static>);
                }
            }
            // ---- END STORE SETUP ----
            #[cfg(target_os = "macos")]{
                app.set_activation_policy(tauri::ActivationPolicy::Accessory);
            };

            let app_handle_tray = app.handle().clone();
            let show_chat_i = MenuItem::with_id(&app_handle_tray, "show_chat", "Show Chat", true, None::<&str>)?;
            let show_settings_i = MenuItem::with_id(&app_handle_tray, "show_settings", "Settings", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(&app_handle_tray, "quit", "Exit", true, None::<&str>)?;

            let tray_menu = MenuBuilder::new(&app_handle_tray)
                .item(&show_chat_i)
                .item(&show_settings_i)
                .separator()
                .item(&quit_i)
                .build()?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().cloned().ok_or("Failed to get default window icon")?)
                .tooltip("Murmur")
                .menu(&tray_menu)
                .on_menu_event(move |app, event| {
                    match event.id.as_ref() {
                        "show_chat" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            } else {
                                eprintln!("main (chat) window not found");
                            }
                        }
                        "show_settings" => {
                            let app_handle = app.clone();
                            let settings_window_label = "settings";

                            if let Some(window) = app_handle.get_webview_window(settings_window_label) {
                                if let Err(e) = window.show() {
                                    eprintln!("Failed to show settings window: {}", e);
                                }
                                if let Err(e) = window.set_focus() {
                                    eprintln!("Failed to focus settings window: {}", e);
                                }
                            } else {
                                println!("Settings window '{}' not found, attempting to create.", settings_window_label);
                                match tauri::WebviewWindowBuilder::new(
                                    &app_handle,
                                    settings_window_label,
                                    tauri::WebviewUrl::App("settings.html".into())
                                )
                                .title("Settings")
                                .inner_size(700.0, 550.0) // Match tauri.conf.json
                                .decorations(true)
                                .resizable(true)
                                .fullscreen(false)
                                .always_on_top(false)
                                .transparent(false)
                                .hidden_title(false)
                                .title_bar_style(tauri::TitleBarStyle::Visible) // Match tauri.conf.json
                                .visible(false) // Create hidden, then show
                                .build() {
                                    Ok(created_window) => {
                                        println!("Settings window '{}' created successfully.", settings_window_label);
                                        if let Err(e) = created_window.show() {
                                            eprintln!("Failed to show newly created settings window: {}", e);
                                        }
                                        if let Err(e) = created_window.set_focus() {
                                            eprintln!("Failed to focus newly created settings window: {}", e);
                                        }
                                    }
                                    Err(e) => {
                                        eprintln!("Failed to create settings window '{}': {}", settings_window_label, e);
                                    }
                                }
                            }
                        }
                        "quit" => {
                            println!("Exit requested from tray menu.");
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .build(app)?;


            #[cfg(desktop)]
            {
                use tauri_plugin_global_shortcut::{
                    Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState,
                };

                let recorder_shortcut = Shortcut::new(Some(Modifiers::META), Code::Backquote);
                let ai_shortcut = Shortcut::new(Some(Modifiers::ALT), Code::Backquote); // ALT for Option key
                let clipboard_shortcut = Shortcut::new(Some(Modifiers::CONTROL), Code::Backquote); // CTRL for clipboard functionality

                if let Some(main_window) = app.get_webview_window("main") {
                    println!("Setting up main (AI interaction) window (TopRight, initially visible)...");
                    let _ = main_window.move_window(Position::TopRight);
                } else {
                    eprintln!("Failed to get main window during setup.");
                }

                let audio_config_handler = audio_config.clone();
                let app_state_handler = app_state.clone();
                let recording_flag_handler = recording_flag.clone();

                app.handle().plugin(
                    tauri_plugin_global_shortcut::Builder::new()
                        .with_handler(move |app, shortcut, event| {
                            let audio_config_clone = audio_config_handler.clone();
                            let app_state_clone = app_state_handler.clone();
                            let recording_flag_clone = recording_flag_handler.clone();
                            let app_handle_clone = app.clone();
                            let shortcut_clone = shortcut.clone();

                            tokio::spawn(async move {
                                if shortcut_clone == recorder_shortcut {
                                    let mut current_app_state = app_state_clone.lock().await;

                                    match event.state() {
                                        ShortcutState::Pressed => {
                                                match *current_app_state {
                                                    RecorderState::Idle => {
                                                        println!("Shortcut Pressed: Idle -> Recording");
                                                        *current_app_state = RecorderState::Recording;
                                                        emit_state_change(&app_handle_clone, RecorderState::Recording);
                                                        drop(current_app_state);

                                                        let _main_window_visible = match app_handle_clone.get_webview_window("main") {
                                                            Some(main_window) => main_window.is_visible().unwrap_or(false),
                                                            None => {
                                                                eprintln!("Main window not found during shortcut press check.");
                                                                false
                                                            }
                                                        };

                                                        play_sound_rodio(&app_handle_clone, "record-start.mp3");

                                                        recording_flag_clone.store(false, Ordering::SeqCst);

                                                        let host = cpal::default_host();
                                                        let device = match host.default_input_device() {
                                                            Some(d) => d,
                                                            None => {
                                                                eprintln!("Error: No input device available");
                                                                let mut state = app_state_clone.lock().await;
                                                                *state = RecorderState::Idle;
                                                                emit_state_change(&app_handle_clone, RecorderState::Idle);
                                                                return;
                                                            }
                                                        };
                                                        let config = match device.default_input_config() {
                                                            Ok(c) => c,
                                                            Err(e) => {
                                                                eprintln!("Error getting default input config: {}", e);
                                                                let mut state = app_state_clone.lock().await;
                                                                *state = RecorderState::Idle;
                                                                emit_state_change(&app_handle_clone, RecorderState::Idle);
                                                                return;
                                                            }
                                                        };

                                                        let sample_format = config.sample_format();
                                                        {
                                                            let mut audio_config_guard = audio_config_clone.lock().await;
                                                            audio_config_guard.sample_rate = config.sample_rate().0;
                                                            audio_config_guard.channels = config.channels();
                                                        }

                                                        let (tx, rx) = unbounded::<Vec<i16>>();

                                                        recording_flag_clone.store(true, Ordering::SeqCst);

                                                        let flag_thread = recording_flag_clone.clone();
                                                        thread::spawn(move || {
                                                            println!("Recording thread started.");
                                                            if let Err(err) = audio::record_audio_stream(
                                                                flag_thread.clone(),
                                                                tx,
                                                                device,
                                                                config,
                                                                sample_format,
                                                            ) {
                                                                eprintln!("Recording error: {}", err);
                                                                flag_thread.store(false, Ordering::SeqCst);
                                                            }
                                                            println!("Recording thread finished.");
                                                        });

                                                        let app_handle_post = app_handle_clone.clone();
                                                        let audio_config_post = audio_config_clone.clone();
                                                        let app_state_post = app_state_clone.clone();
                                                        let recording_flag_post = recording_flag_clone.clone();

                                                        tokio::spawn(async move {
                                                            println!("Post-processing task spawned, waiting for recording flag...");

                                                            while recording_flag_post.load(Ordering::SeqCst) {
                                                                tokio::time::sleep(Duration::from_millis(50)).await;
                                                            }
                                                            println!("Post-processing task detected recording stopped.");

                                                            let mut all_pcm_data = Vec::new();
                                                            while let Ok(chunk) = rx.try_recv() {
                                                                all_pcm_data.extend(chunk);
                                                            }
                                                            while let Ok(chunk) = rx.try_recv() {
                                                                all_pcm_data.extend(chunk);
                                                            }
                                                            println!("Collected {} samples from channel.", all_pcm_data.len());

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

                                                            let data_size = wav_data.len().saturating_sub(44);
                                                            let bytes_per_sample = 2u32;
                                                            let duration_secs = if sample_rate > 0 && channels > 0 {
                                                                data_size as f32 / (sample_rate * u32::from(channels) * bytes_per_sample) as f32
                                                            } else { 0.0 };
                                                            println!("Post-processing: Calculated duration: {:.2}s", duration_secs);

                                                            if duration_secs > 1.0 {
                                                                println!("Post-processing: Duration > 1s. Starting transcription.");
                                                                {
                                                                    let mut state = app_state_post.lock().await;
                                                                    *state = RecorderState::Transcribing;
                                                                    emit_state_change(&app_handle_post, RecorderState::Transcribing);
                                                                }

                                                                println!("Sending WAV audio data to frontend for transcription. Size: {} bytes", wav_data.len());
                                                
                                                if let Some(main_window) = app_handle_post.get_webview_window("main") {
                                                    println!("Found main (AI interaction) window, sending audio data...");
                                                    
                                                    let wav_data_clone = wav_data.clone();
                                                    tokio::spawn(async move {
                                                        if let Err(e) = main_window.show() { eprintln!("Failed to show main window: {}", e); }
                                                        if let Err(e) = main_window.set_focus() { eprintln!("Failed to focus main window: {}", e); }
                                                        
                                                        let payload = serde_json::json!({
                                                            "data": wav_data_clone,
                                                            "isClipboardMode": false
                                                        });
                                                        
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
                                                                play_sound_rodio(&app_handle_post, "record-end.mp3");
                                                            }

                                                            {
                                                                let mut state = app_state_post.lock().await;
                                                                *state = RecorderState::Idle;
                                                                emit_state_change(&app_handle_post, RecorderState::Idle);
                                                            }
                                                            println!("Post-processing task finished.");
                                                        }); 

                                                    }
                                                    RecorderState::Recording | RecorderState::Transcribing => {
                                                        println!("Shortcut Pressed: State is {:?} (Ignoring)", *current_app_state);
                                                    }
                                                }
                                            }
                                            ShortcutState::Released => {
                                                let current_state = *current_app_state;
                                                drop(current_app_state);

                                                if let RecorderState::Recording = current_state {
                                                    println!("Shortcut Released: Recording -> Processing...");
                                                    println!("Setting recording flag to false.");
                                                    recording_flag_clone.store(false, Ordering::SeqCst);
                                                } else {
                                                    println!("Shortcut Released: Not in Recording state (Ignoring)");
                                                }
                                            }
                                        }
                                } else if shortcut_clone == ai_shortcut {
                                    if event.state() == ShortcutState::Pressed {
                                        println!("AI Shortcut (Alt+`) Pressed: Toggling Main (AI Interaction) Window");
                                        if let Some(main_window) = app_handle_clone.get_webview_window("main") {
                                            tokio::spawn(async move {
                                                match main_window.is_visible() {
                                                    Ok(true) => {
                                                        println!("Main window is visible, hiding it.");
                                                        if let Err(e) = main_window.hide() {
                                                            eprintln!("Failed to hide main window: {}", e);
                                                        }
                                                    }
                                                    Ok(false) => {
                                                        println!("Main window is not visible, showing and focusing it.");
                                                        if let Err(e) = main_window.show() { 
                                                            eprintln!("Failed to show main window: {}", e); 
                                                        }
                                                        if let Err(e) = main_window.set_focus() { 
                                                            eprintln!("Failed to focus main window: {}", e); 
                                                        }
                                                    }
                                                    Err(e) => {
                                                        eprintln!("Failed to check main window visibility: {}. Assuming not visible and attempting to show.", e);
                                                        if let Err(e_show) = main_window.show() { 
                                                            eprintln!("Failed to show main window (fallback): {}", e_show); 
                                                        }
                                                        if let Err(e_focus) = main_window.set_focus() { 
                                                            eprintln!("Failed to focus main window (fallback): {}", e_focus); 
                                                        }
                                                    }
                                                }
                                            });
                                        } else {
                                            eprintln!("Main (AI Interaction) window not found in shortcut handler.");
                                        }
                                    }
                                }
                                else if shortcut_clone == clipboard_shortcut {
                                    let mut current_app_state = app_state_clone.lock().await;

                                    match event.state() {
                                        ShortcutState::Pressed => {
                                            match *current_app_state {
                                                RecorderState::Idle => {
                                                        println!("Clipboard Shortcut Pressed: Idle -> Recording");
                                                        *current_app_state = RecorderState::Recording;
                                                        emit_state_change(&app_handle_clone, RecorderState::Recording);
                                                        drop(current_app_state);

                                                        play_sound_rodio(&app_handle_clone, "record-start.mp3");

                                                        recording_flag_clone.store(false, Ordering::SeqCst);

                                                        let host = cpal::default_host();
                                                        let device = match host.default_input_device() {
                                                            Some(d) => d,
                                                            None => {
                                                                eprintln!("Error: No input device available");
                                                                let mut state = app_state_clone.lock().await;
                                                                *state = RecorderState::Idle;
                                                                emit_state_change(&app_handle_clone, RecorderState::Idle);
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
                                                                return;
                                                            }
                                                        };

                                                        let sample_format = config.sample_format();
                                                        {
                                                            let mut audio_config_guard = audio_config_clone.lock().await;
                                                            audio_config_guard.sample_rate = config.sample_rate().0;
                                                            audio_config_guard.channels = config.channels();
                                                        }

                                                        let (tx, rx) = unbounded::<Vec<i16>>();

                                                        recording_flag_clone.store(true, Ordering::SeqCst);

                                                        let flag_thread = recording_flag_clone.clone();
                                                        thread::spawn(move || {
                                                            println!("Recording thread started for clipboard.");
                                                            if let Err(err) = audio::record_audio_stream(
                                                                flag_thread.clone(),
                                                                tx,
                                                                device,
                                                                config,
                                                                sample_format,
                                                            ) {
                                                                eprintln!("Recording error: {}", err);
                                                                flag_thread.store(false, Ordering::SeqCst);
                                                            }
                                                            println!("Recording thread finished for clipboard.");
                                                        });

                                                        let app_handle_post = app_handle_clone.clone();
                                                        let audio_config_post = audio_config_clone.clone();
                                                        let app_state_post = app_state_clone.clone();
                                                        let recording_flag_post = recording_flag_clone.clone();

                                                        tokio::spawn(async move {
                                                            println!("Clipboard post-processing task spawned, waiting for recording flag...");

                                                            while recording_flag_post.load(Ordering::SeqCst) {
                                                                tokio::time::sleep(Duration::from_millis(50)).await;
                                                            }
                                                            println!("Clipboard post-processing task detected recording stopped.");

                                                            let mut all_pcm_data = Vec::new();
                                                            while let Ok(chunk) = rx.try_recv() {
                                                                all_pcm_data.extend(chunk);
                                                            }
                                                            while let Ok(chunk) = rx.try_recv() {
                                                                all_pcm_data.extend(chunk);
                                                            }
                                                            println!("Collected {} samples from channel for clipboard.", all_pcm_data.len());

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

                                                            let data_size = wav_data.len().saturating_sub(44);
                                                            let bytes_per_sample = 2u32;
                                                            let duration_secs = if sample_rate > 0 && channels > 0 {
                                                                data_size as f32 / (sample_rate * u32::from(channels) * bytes_per_sample) as f32
                                                            } else { 0.0 };
                                                            println!("Clipboard post-processing: Calculated duration: {:.2}s", duration_secs);

                                                            if duration_secs > 1.0 {
                                                                println!("Clipboard post-processing: Duration > 1s. Starting transcription.");
                                                                {
                                                                    let mut state = app_state_post.lock().await;
                                                                    *state = RecorderState::Transcribing;
                                                                    emit_state_change(&app_handle_post, RecorderState::Transcribing);
                                                                }

                                                                println!("Sending clipboard WAV audio data to frontend. Size: {} bytes", wav_data.len());
                                                                
                                                                if let Some(main_window) = app_handle_post.get_webview_window("main") {
                                                                    println!("Found main window, sending audio data for clipboard operation...");
                                                                    
                                                                    let payload = serde_json::json!({
                                                                        "data": wav_data,
                                                                        "isClipboardMode": true
                                                                    });
                                                                    
                                                                    tokio::spawn(async move {
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
                                                                play_sound_rodio(&app_handle_post, "record-end.mp3");
                                                            }

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
                                            ShortcutState::Released => {
                                                let current_state = *current_app_state;
                                                drop(current_app_state);

                                                if let RecorderState::Recording = current_state {
                                                    println!("Clipboard Shortcut Released: Recording -> Processing...");
                                                    println!("Setting recording flag to false for clipboard.");
                                                    recording_flag_clone.store(false, Ordering::SeqCst);
                                                } else {
                                                    println!("Clipboard Shortcut Released: Not in Recording state (Ignoring)");
                                                }
                                            }
                                        }
                                }
                            });
                        })
                        .build(),
                )?;

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
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_app_handle, event| match event {
            tauri::RunEvent::ExitRequested { .. } => {
                println!("Exit requested, allowing exit.");
            }
            _ => {}
        });
}
