

class AudioEngine {

  

  constructor() {

    this.TTS = new TTS();

  }

  // Use speech synthesis to talk
  speakText = (text) => {
    this.TTS.speakText(text);
  }
}