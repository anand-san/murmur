fn main() {
    // Load .env file if it exists
    dotenvy::dotenv().ok();
    tauri_build::build()
}
