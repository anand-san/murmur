use std::sync::{Arc, Mutex};

// --- State Definitions ---

// Audio state to keep track of recording details
// Fields are pub(crate) allowing access only within this crate (src-tauri)
#[derive(Debug)] // Add Debug for easier logging if needed
pub(crate) struct AudioState {
    pub(crate) is_recording: bool,
    pub(crate) audio_data: Option<Vec<u8>>,
    pub(crate) sample_rate: u32,
    pub(crate) channels: u16,
}

impl AudioState {
    pub(crate) fn new() -> Self {
        Self {
            is_recording: false,
            audio_data: None,
            sample_rate: 44100, // Default, updated on recording start
            channels: 1,        // Default, updated on recording start
        }
    }
}

// Type alias for managed AudioState - needs to be accessible outside this module
pub type AudioStateRef = Arc<Mutex<AudioState>>;

// Global application state for shortcut logic - needs to be accessible outside this module
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum RecorderState {
    Idle,
    Recording,
    Processed,
}

// Type alias for managed RecorderState (AppState) - needs to be accessible outside this module
pub type AppStateRef = Arc<Mutex<RecorderState>>;
