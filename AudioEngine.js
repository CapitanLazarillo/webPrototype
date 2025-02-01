

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

    // Stereo
    if (this.audioContext.destination.maxChannelCount < 2) {
      alert("Only one audio channel output in your computer. Stereo and spatial audio not possible.");
    }

    // Keep track of sources. As this are related to filename, we can reuse them
    this.sources = {};

    // Position listener
    this.listener = this.audioContext.listener;

    // Panner node (actually where the source is)
    // Panner for HRTF
    // -Z is forward, +Y is up, +X is right
    this.panner = this.audioContext.createPanner();
    this.panner.panningModel = 'HRTF';
    this.panner.distanceModel = 'exponential';
    this.panner.rolloffFactor = 1;

  }
  // Resume or create audio context
  // https://developer.chrome.com/blog/autoplay/#webaudio
  // resumeAudioContext = () => {
  //   if (this.audioContext == undefined) {
  //     debugger;
  //     this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  //   } else {
  //     if (this.audioContext.state == 'suspended') {
  //       this.audioContext.resume();
  //     } else {
  //       console.log("AudioContext was already running");
  //       debugger;
  //     }
  //   }
  // }


  // TODO: CREATE FILE MANAGER AND HAVE FILE LOADING THERE? NOT NECESSARY AS THIS IS PROTOTYPE!
  // Load recorded audio files
  loadAudioFiles = () => {


    let categories = ['N', 'B', 'H'];
    let baseURL = './assets/audios/';
    let urls = [];
    let fileNames = [];

    // URLS
    // Categories
    for (let cInd = 0; cInd < 3; cInd++) {
      // Clock hours
      for (let i = 1; i < 13; i++) {
        urls.push(baseURL + categories[cInd] + i + '.wav');
        fileNames.push(categories[cInd] + i);
      }
    }
    // Buoys
    let buoyWavFileNames = ['boya1', 'boya2', 'boya3', 'alas', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce'];
    for (let i = 0; i < buoyWavFileNames.length; i++) {
      urls.push(baseURL + 'buoys/' + buoyWavFileNames[i] + '.wav');
      fileNames.push(buoyWavFileNames[i]);
    }


    console.log("Loading " + urls.length + " audio files");
    // Promises
    for (let i = 0; i < urls.length; i++) {
      let promise = fetch(urls[i])
        .then(r => r.arrayBuffer())
        .then(data => this.audioContext.decodeAudioData(data))
        .then(buffer => {
          this.audioBuffers[fileNames[i]] = buffer;
          return buffer;
        })
        .catch(e => { debugger; console.error(e) });

      this.promises.push(promise);
    }

    // All audio files lodaded
    Promise.allSettled(this.promises).then(values => {
      this.areBuffersLoaded = true;
      console.log("Audio files loaed");
    }).catch(e => { debugger; console.error(e) });
  }









  // Use speech synthesis to talk
  speakText = (text, forceNow) => {
    return this.TTS.speakText(text, forceNow);
  }

  playAudioFile = (fileName, angle) => {
    return new Promise((resolve, reject) => {
      // No audio
      if (this.audioBuffers[fileName] == undefined) {
        reject(new Error('Audio file ' + fileName + ' not found / loaded.'));
        debugger;
      }

      
      // Stop other sources
      // Iterate sources and stop them
      Object.keys(this.sources).forEach(kk => {
        let ss = this.sources[kk];
        if (ss.isPlaying) {
          ss.onended = () => reject("New audio overlapping, stop this one.");
          ss.stop();
          ss.isPlaying = false;
        }
      })



      // Create source for audio file playback
      const source = this.audioContext.createBufferSource();
      source.buffer = this.audioBuffers[fileName];
      this.sources[fileName] = source;


    
      // Position the source (panner)
      this.panner.positionZ.value = -Math.cos(angle * Math.PI / 180) * 2;
      this.panner.positionX.value = Math.sin(angle * Math.PI / 180) * 2;

      // Connect pipeline
      source.connect(this.panner);
      this.panner.connect(this.audioContext.destination);

      // Return promise
      source.onended = () => {
        console.log("Play audio file ended");
        source.isPlaying = false;
        resolve();
      };

      // Play audio
      source.start();
      source.isPlaying = true;
    });







  }
}