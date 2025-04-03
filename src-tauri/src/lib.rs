// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::Manager;
use tauri_plugin_positioner::{WindowExt, Position};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// Hide the main window
#[tauri::command]
fn hide_window(window: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = window.get_webview_window("main") {
        window.hide().map_err(|e| e.to_string())
    } else {
        Err("Main window not found".to_string())
    }
}

/// Show the main window
#[tauri::command]
fn show_window(window: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = window.get_webview_window("main") {
        window.show().map_err(|e| e.to_string())
    } else {
        Err("Main window not found".to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
    .plugin(tauri_plugin_positioner::init())
    .invoke_handler(tauri::generate_handler![greet, hide_window, show_window])
        .setup(|app| {
            #[cfg(desktop)]
            {
                // Position and hide window on startup
                if let Some(main_window) = app.get_webview_window("main") {
                    // Position at the top center
                    let _ = main_window.move_window(Position::BottomCenter);
                    // Hide the window initially
                    let _ = main_window.hide();
                }
                
                use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

                let shortcut_key = Shortcut::new(Some(Modifiers::SHIFT), Code::Backquote);
                app.handle().plugin(
                    tauri_plugin_global_shortcut::Builder::new().with_handler(move |app, shortcut, event| {
                        if shortcut == &shortcut_key {
                            if let Some(main_window) = app.get_webview_window("main") {
                                match event.state() {
                                  ShortcutState::Pressed => {
                                    println!("Shortcut Pressed! Showing window");
                                    let _ = main_window.show();
                                  }
                                  ShortcutState::Released => {
                                    println!("Shortcut Released! Hiding window");
                                    let _ = main_window.hide();
                                  }
                                }
                            }
                        }
                    })
                    .build(),
                )?;

                app.global_shortcut().register(shortcut_key)?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
