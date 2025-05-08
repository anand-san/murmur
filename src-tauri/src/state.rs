use std::sync::atomic::AtomicBool;
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Debug, Clone)]
pub(crate) struct AudioConfig {
    pub(crate) sample_rate: u32,
    pub(crate) channels: u16,
}

impl AudioConfig {
    pub(crate) fn new() -> Self {
        Self {
            sample_rate: 44100,
            channels: 1,
        }
    }
}

pub type AudioConfigRef = Arc<Mutex<AudioConfig>>;

pub type RecordingFlag = Arc<AtomicBool>;

#[derive(Clone, Copy, Debug, PartialEq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub enum RecorderState {
    Idle,
    Recording,
    Transcribing,
}

pub type AppStateRef = Arc<Mutex<RecorderState>>;
