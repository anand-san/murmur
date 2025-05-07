# Murmur - Voice-Activated AI Assistant

## Product Overview

Murmur is a desktop application that enables seamless voice interaction through a minimalist, non-intrusive interface. It offers two primary functions via global keyboard shortcuts: instantly transcribing voice to text directly into any application, and engaging with an AI assistant using voice input. Murmur streamlines workflows by minimizing context switching.

## Key Features

### 1. Voice-to-AI Chat (`Cmd + \`)

- **Global Shortcut Activation**: Initiate voice-to-AI interaction anytime by pressing and holding `Cmd + \`` (backtick).
- **Visual Feedback**: Minimalist floating window with a pulsing orb indicates active recording.
- **Audio Cues**: Distinct sounds play at the start and end of recording sessions.
- **Release to Process**: Simply release the shortcut key to end recording, transcribe, and send to the AI assistant. Results appear in a dedicated chat window.

### 2. Voice-to-Text Paste (`Option + \`)

- **Global Shortcut Activation**: Dictate text directly into your active application by pressing and holding `Option + \`` (backtick).
- **Instant Transcription & Pasting**: Release the keys, and Murmur transcribes your speech and automatically pastes the text into the focused input field.
- **Seamless Input**: Ideal for quick notes, messages, or code snippets without manual typing.

### 2. Intelligent Audio Processing

- **Automatic Transcription**: Voice recordings are converted to text using local processing
- **Duration Filtering**: Only processes recordings longer than 1 second to avoid accidental activations
- **Background Processing**: All audio handling happens in separate threads for optimal performance

### 4. AI Assistant Integration

- **Contextual Responses**: AI processes transcribed text from the `Cmd + \`` shortcut and provides relevant responses.
- **Dedicated Interaction Window**: Clean interface for viewing AI responses and continued conversation initiated via ` Cmd + \`` or  `Alt + \``.
- **Direct Text Access**: Alternative shortcut (`Alt + \``) to open the AI assistant window directly for text-based interaction.
- **Conversation Threading**: Support for ongoing conversations with context preservation.

## Technical Architecture

### Frontend

- React + TypeScript with TailwindCSS for responsive UI
- Multiple specialized windows (main app, recorder feedback, AI interaction)
- UI components from assistant-ui for rich message formatting

### Backend

- Rust-powered Tauri framework for native performance
- Secure, efficient audio processing pipeline
- State machine architecture to manage recording and processing states
- Multi-threaded design with non-blocking I/O for responsive experience

### Integration Capabilities

- Local audio processing with minimal latency
- Integration with OpenAI for AI conversation capabilities
- Extensible architecture for additional AI model support

## User Experience

- **Lightweight**: Minimal resource footprint while running in the background
- **Always Available**: Global shortcuts provide instant access from any application
- **Non-disruptive**: Small, focused windows avoid interrupting workflow
- **Fluid Interaction**: Seamless transition from voice to text to AI response

## Target Users

- Knowledge workers seeking quick information or text input without context switching.
- Professionals who need hands-free access to AI assistance or dictation.
- Anyone looking to enhance productivity through voice-activated tools.
- Developers and creators who want quick answers or code snippets during their workflow.

## Competitive Advantage

- **Speed**: From voice to AI response in seconds with minimal user interaction
- **Minimal Interface**: Designed to complement rather than interrupt existing workflows
- **Desktop Native**: Not dependent on browser or web connectivity for core functions
- **Privacy-focused**: Local processing options for sensitive environments
