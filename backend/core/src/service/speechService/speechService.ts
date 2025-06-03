import env from "../../../env";

export const transcribeAudio = async (audioFile: File): Promise<string> => {
  try {
    if (!env.STT_API_URL || !env.STT_MODEL) {
      throw new Error("STT_API_URL and STT_API_KEY are not configured");
    }

    console.log("STT Request:", {
      url: `${env.STT_API_URL}/v1/audio/transcriptions`,
    });

    // Create FormData for multipart/form-data request
    const formData = new FormData();
    formData.append("file", audioFile);
    formData.append("model", env.STT_MODEL);

    // Make direct API call using fetch
    const response = await fetch(`${env.STT_API_URL}/v1/audio/transcriptions`, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${env.STT_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Transcription API failed: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();
    return result.text || "";
  } catch (error) {
    throw new Error(
      `Audio transcription failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

export const generateSpeech = async (text: string): Promise<ArrayBuffer> => {
  try {
    if (!env.TTS_API_URL || !env.TTS_MODEL) {
      throw new Error("TTS_API_URL and TTS_MODEL are not configured");
    }

    const requestBody: any = {
      model: env.TTS_MODEL,
      input: text,
      response_format: "wav",
      voice: env.TTS_VOICE,
    };

    console.log("TTS Request:", {
      url: `${env.TTS_API_URL}/v1/audio/speech`,
      requestBody,
    });

    // Make direct API call using fetch
    const response = await fetch(`${env.TTS_API_URL}/v1/audio/speech`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.TTS_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let errorMessage = `TTS API failed: ${response.status} ${response.statusText}`;

      // Try to get more detailed error information
      try {
        const errorBody = await response.text();
        errorMessage += ` - Response: ${errorBody}`;
      } catch (e) {
        // If we can't read the response body, just use the status
      }

      throw new Error(errorMessage);
    }

    const audioBuffer = await response.arrayBuffer();
    return audioBuffer;
  } catch (error) {
    throw new Error(
      `Speech generation failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};
