

class Mode {

  timer = 0;
  audioEngine;

  constructor(name, period, audioEngine) {
    this.name = name;
    this.period = period * 1000;
    this.timer = period * 1000; // start activated
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

  update = (dt, bearing) => {
    this.timer += dt;
    if (this.timer > this.period) {
      this.timer = 0;
      this.sendSignal(bearing);
    }
  }

  sendSignal = (bearing) => {
    let angle = 360 - bearing;
    this.audioEngine.playAudioFile("N" + degreesToClockNumber(angle), angle);
    console.log("Modo norte " + degreesToClockNumber(angle) + ", " + angle);
  }
}







class ModeBearing extends ModeNorth {

  sendSignal = (bearing) => {
    this.audioEngine.playAudioFile("B" + degreesToClockNumber(bearing), 0); // Bearing should be expressed in front of the user
    console.log("Modo rumbo " + degreesToClockNumber(bearing) + ", " + bearing);
  }
}




class ModeHome extends Mode {
  // Update requires own position and home position
  update = (dt, distanceToHome, relBearing) => {
    this.timer += dt;
    if (this.timer > this.period) {
      this.timer = 0; // Timer when finishing to speak or regular periods?
      this.sendSignal(distanceToHome, relBearing);
    }
  }
  // Calculate distance and relative orientation
  sendSignal = (distanceToHome, relBearing) => {

    let clockAngle = degreesToClockNumber(relBearing);
    // Start with orientation
    this.audioEngine.playAudioFile("H" + clockAngle, relBearing)
      .then(() => {
        // And then the distance
        this.audioEngine.speakText("A " + distanceConversion(distanceToHome))
      });

    console.log("Modo amarre " + clockAngle + ", " + relBearing + ", " + parseInt(distanceToHome));

  }
}


export { Mode, ModeNorth, ModeBearing, ModeHome };



