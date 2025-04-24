// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // Environment variables are now loaded during build time via build.rs
    // and accessed using env!("VAR_NAME")
    murmur_lib::run()
}
