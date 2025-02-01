

class Mode {

  timer = 0;
  audioEngine;

  constructor(name, period, audioEngine) {
    this.name = name;
    this.period = period;
    this.timer = period; // start activated
    this.audioEngine = audioEngine;
  }


  // PUBLIC METHODS
  update = (dt) => {

    this.timer += dt;

    if (this.timer > this.period) {
      this.timer = 0;
      this.sendSignal();
    }
  }

  sendSignal = () => {

  }

  modeActivated = () => {
    this.audioEngine.speakText('Modo ' + this.name);
    // TODO CONNECT EVENT LISTENER. WHEN TTS FINISHES, ALLOW MESSAGES FROM MODO
    this.timer = this.period; // Reset timer
  }
}



class ModeNorth extends Mode {

  update = (dt, clockNumber, bearing) => {

    this.timer += dt;

    if (this.timer > this.period) {
      this.timer = 0;
      this.sendSignal(clockNumber, bearing);
    }
  }

  sendSignal = (clockNumber, bearing) => {
    this.audioEngine.playAudioFile("N" + clockNumber, bearing);
  }
}

export {Mode, ModeNorth};



