

class AudioEngine {

  audioBuffers = {}
  promises = [];
  areBuffersLoaded = false;

  constructor() {

    this.TTS = new TTS();

  }


  // INTERNAL FUNCTIONS



  // PUBLIC FUNCTIONS
  // Set audio context
  setAudioContext = (audioContext) => {
    this.audioContext = audioContext;
  }
  // Resume or create audio context
  // https://developer.chrome.com/blog/autoplay/#webaudio
  resumeAudioContext = () => {
    if (this.audioContext == undefined) {
      debugger;
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } else {
      if (this.audioContext.state == 'suspended') {
        this.audioContext.resume();
      } else {
        console.log("AudioContext was already running");
        debugger;
      }
    }
  }
  // Load recorded audio files
  loadAudioFiles = () => {
    console.log("Loading " + 3 * 12 + " audio files");

    let categories = ['N', 'B', 'H'];
    let baseURL = './assets/audios/';
    // Categories
    for (let cInd = 0; cInd < 3; cInd++) {
      // Clock hours
      for (let i = 1; i < 13; i++) {
        let promise = fetch(baseURL + categories[cInd] + i + '.wav')
          .then(r => r.arrayBuffer())
          .then(data => this.audioContext.decodeAudioData(data))
          .then(buffer => {
            this.audioBuffers[categories[cInd] + i] = buffer;
            return buffer;
          })
          .catch(e => { debugger; console.error(e) });

        this.promises.push(promise);
      }
    }

    // All audio files lodaded
    Promise.allSettled(this.promises).then(values => {
      this.areBuffersLoaded = true;
      console.log("Audio files loaed");
    }).catch(e => { debugger; console.error(e) });
  }






  // Use speech synthesis to talk
  speakText = (text) => {
    this.TTS.speakText(text);
  }
}