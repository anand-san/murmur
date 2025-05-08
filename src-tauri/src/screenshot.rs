use base64::{engine::general_purpose::STANDARD, Engine as _};
use image::codecs::png::PngEncoder;
use image::ImageEncoder;
use serde::{Deserialize, Serialize};
use std::io::Cursor;
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Emitter};
use xcap::Monitor;

#[derive(Clone, Serialize, Deserialize)]
pub struct ScreenshotStatus {
    status: String,
    progress: Option<f32>,
    error: Option<String>,
}

const EVENT_SCREENSHOT_STATUS: &str = "screenshot:status";
const EVENT_SCREENSHOT_RESULT: &str = "screenshot:result";
const EVENT_SCREENSHOT_ERROR: &str = "screenshot:error";

#[tauri::command]
pub fn capture_screenshot(app_handle: AppHandle) -> Result<(), String> {
    let app_handle_clone = app_handle.clone();

    thread::spawn(move || {
        _ = app_handle_clone.emit(
            EVENT_SCREENSHOT_STATUS,
            ScreenshotStatus {
                status: "processing".to_string(),
                progress: Some(0.0),
                error: None,
            },
        );

        thread::sleep(Duration::from_millis(250));

        _ = app_handle_clone.emit(
            EVENT_SCREENSHOT_STATUS,
            ScreenshotStatus {
                status: "processing".to_string(),
                progress: Some(0.1),
                error: None,
            },
        );

        let monitors = match Monitor::all() {
            Ok(monitors) => monitors,
            Err(err) => {
                let error_msg = format!("Failed to get monitors: {}", err);
                _ = app_handle_clone.emit(EVENT_SCREENSHOT_ERROR, &error_msg);
                _ = app_handle_clone.emit(
                    EVENT_SCREENSHOT_STATUS,
                    ScreenshotStatus {
                        status: "error".to_string(),
                        progress: None,
                        error: Some(error_msg.clone()),
                    },
                );
                return;
            }
        };

        _ = app_handle_clone.emit(
            EVENT_SCREENSHOT_STATUS,
            ScreenshotStatus {
                status: "processing".to_string(),
                progress: Some(0.2),
                error: None,
            },
        );

        let primary_monitor = match monitors.into_iter().next() {
            Some(monitor) => monitor,
            None => {
                let error_msg = "No monitors found".to_string();
                _ = app_handle_clone.emit(EVENT_SCREENSHOT_ERROR, &error_msg);
                _ = app_handle_clone.emit(
                    EVENT_SCREENSHOT_STATUS,
                    ScreenshotStatus {
                        status: "error".to_string(),
                        progress: None,
                        error: Some(error_msg.clone()),
                    },
                );
                return;
            }
        };

        match primary_monitor.name() {
            Ok(name) => println!("Capturing monitor: {}", name),
            Err(err) => println!("Capturing monitor (unknown name): {}", err),
        }

        _ = app_handle_clone.emit(
            EVENT_SCREENSHOT_STATUS,
            ScreenshotStatus {
                status: "processing".to_string(),
                progress: Some(0.4),
                error: None,
            },
        );

        let img_buf = match primary_monitor.capture_image() {
            Ok(img) => img,
            Err(err) => {
                let error_msg = format!("Failed to capture screen: {}", err);
                _ = app_handle_clone.emit(EVENT_SCREENSHOT_ERROR, &error_msg);
                _ = app_handle_clone.emit(
                    EVENT_SCREENSHOT_STATUS,
                    ScreenshotStatus {
                        status: "error".to_string(),
                        progress: None,
                        error: Some(error_msg.clone()),
                    },
                );
                return;
            }
        };

        _ = app_handle_clone.emit(
            EVENT_SCREENSHOT_STATUS,
            ScreenshotStatus {
                status: "processing".to_string(),
                progress: Some(0.6),
                error: None,
            },
        );

        let mut png_bytes: Vec<u8> = Vec::new();
        let encoder = PngEncoder::new(Cursor::new(&mut png_bytes));

        match encoder.write_image(
            &img_buf,
            img_buf.width(),
            img_buf.height(),
            image::ColorType::Rgba8.into(),
        ) {
            Ok(_) => {}
            Err(err) => {
                let error_msg = format!("Failed to encode image: {}", err);
                _ = app_handle_clone.emit(EVENT_SCREENSHOT_ERROR, &error_msg);
                _ = app_handle_clone.emit(
                    EVENT_SCREENSHOT_STATUS,
                    ScreenshotStatus {
                        status: "error".to_string(),
                        progress: None,
                        error: Some(error_msg.clone()),
                    },
                );
                return;
            }
        }

        _ = app_handle_clone.emit(
            EVENT_SCREENSHOT_STATUS,
            ScreenshotStatus {
                status: "processing".to_string(),
                progress: Some(0.8),
                error: None,
            },
        );

        let base64_string = STANDARD.encode(&png_bytes);

        _ = app_handle_clone.emit(
            EVENT_SCREENSHOT_STATUS,
            ScreenshotStatus {
                status: "processing".to_string(),
                progress: Some(0.9),
                error: None,
            },
        );

        _ = app_handle_clone.emit(EVENT_SCREENSHOT_RESULT, &base64_string);

        _ = app_handle_clone.emit(
            EVENT_SCREENSHOT_STATUS,
            ScreenshotStatus {
                status: "idle".to_string(),
                progress: Some(1.0),
                error: None,
            },
        );
    });

    Ok(())
}
