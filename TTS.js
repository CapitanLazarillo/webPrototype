

class TTS {

  speechRate = 1;
  speechPitch = 1;
  speechVolume = 1;

  language = 'es-ES';

  isTTSReady = false;

  constructor() {
    if ('speechSynthesis' in window) {
      this.speechSynthesis = new SpeechSynthesisUtterance();
      // Define properties
      this.speechSynthesis.rate = this.speechRate;
      this.speechSynthesis.pitch = this.speechPitch;
      this.speechSynthesis.volume = this.speechVolume;

      let voices = window.speechSynthesis.getVoices();
      if (voices.length == 0) {
        // Wait for voices to be loaded
        window.speechSynthesis.onvoiceschanged = () => {
          voices = window.speechSynthesis.getVoices();
          this.speechSynthesis.voice = voices.find(voice => voice.lang === this.language);
          this.isTTSReady = true;
        }
      } else {
        this.speechSynthesis.voice = voices.find(voice => voice.lang === this.language);
        this.isTTSReady = true;
      }


    } else {
      alert('Speech synthesis is not supported in this browser. Please use Google Chrome.');
    }
  }


  speakText = (text) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser. Please use Google Chrome.');
      return;
    }
    if (!this.isTTSReady) {
      alert('Speech synthesis is not ready (voices not loaded)');
      return;
    }

    // Overwrite
    window.speechSynthesis.cancel();
    this.speechSynthesis.text = text;
    window.speechSynthesis.speak(this.speechSynthesis);

  }
}