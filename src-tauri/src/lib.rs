// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
    .plugin(tauri_plugin_opener::init())
    .invoke_handler(tauri::generate_handler![greet])
        .setup(|app| {
            #[cfg(desktop)]
            {
                use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

                let shortcut_key = Shortcut::new(Some(Modifiers::SHIFT), Code::Backquote);
                app.handle().plugin(
                    tauri_plugin_global_shortcut::Builder::new().with_handler(move |_app, shortcut, event| {
                        if shortcut == &shortcut_key {
                            match event.state() {
                              ShortcutState::Pressed => {
                                println!("Shortcut Pressed!");
                              }
                              ShortcutState::Released => {
                                println!("Shortcut Released!");
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
