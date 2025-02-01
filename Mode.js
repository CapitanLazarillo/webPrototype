

class Mode {

  timer = 0;
  audioEngine;

  constructor(name, period, audioEngine) {
    this.name = name;
    this.period = period * 1000;
    this.timer = (period - 2) * 1000; // start activated
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
    this.audioEngine.speakText('Modo ' + this.name, true)
      .then(() => this.timer = this.period);// Reset timer

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
    this.audioEngine.playAudioFile("N" + degreesToClockNumber(angle), angle)
      .catch(e => console.log(e));
    console.log("Modo norte " + degreesToClockNumber(angle) + ", " + angle);
  }
}











class ModeBearing extends ModeNorth {

  sendSignal = (bearing) => {
    this.audioEngine.playAudioFile("B" + degreesToClockNumber(bearing), 0) // Bearing should be expressed in front of the user
      .catch(e => console.log(e));
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
      })
      .catch(e => console.log(e));

    console.log("Modo amarre " + clockAngle + ", " + relBearing + ", " + parseInt(distanceToHome));

  }
}






class ModeBuoy extends ModeHome {

  sendSignal = (distanceToBuoy, relBearing) => {
    let clockAngle = degreesToClockNumber(relBearing);
    let buoyFileName = this.name.replace(" ", "");
    let alasFileName = 'alas';
    let clockFileName = clockNumberToESFileName(clockAngle);

    this.audioEngine.playAudioFile(buoyFileName, relBearing)
      .then(() => this.audioEngine.playAudioFile(alasFileName, relBearing))
      .then(() => this.audioEngine.playAudioFile(clockFileName, relBearing))
      .then(() => this.audioEngine.speakText("A " + distanceConversion(distanceToBuoy)))
      .catch(e => console.log(e));

    console.log("Modo " + this.name + ", " + clockAngle + ", " + relBearing + ", " + parseInt(distanceToBuoy));
  }
}


export { Mode, ModeNorth, ModeBearing, ModeHome, ModeBuoy };



