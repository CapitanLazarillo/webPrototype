

class InteractionManager {

  // Modes (constant reporting)
  modes = ["apagado", "norte", "amarre", "boia 1", "boia 2", "boia 3"];
  selectedModeIndex = 0;

  // Warnings
  warnings = ["proximidad", "objetos cercanos"]; // Escora should be here too
  warningsStatus = [false, false];

  // Keydown timeout (time between key presses)
  keyTimeout = 300; // ms

  constructor() {

    // Keydown (space) interaction
    this.createEventBindings();

    // Create audio engine
    this.audioEngine = new AudioEngine();

  }

  // USER EVENTS
  // Event binding
  createEventBindings = () => {
    let pressCount = 0;
    let timeout;
    document.addEventListener('keydown', (event) => {
      if (event.code === 'Space') { // Check if the pressed key is the spacebar
        pressCount++;

        clearTimeout(timeout); // Clear any existing timeout to reset the detection window

        timeout = setTimeout(() => {
          if (pressCount === 1) {
            this.singlePressHandler();
          } else if (pressCount === 2) {
            this.doublePressHandler();
          } else if (pressCount === 3) {
            this.triplePressHandler();
          }
          else if (pressCount > 3) {
            this. quadruplePressHandler();
          }
          pressCount = 0; // Reset the count after handling
        }, this.keyTimeout); // Adjust the delay (in milliseconds) to suit your needs
      }
    });
  }

  singlePressHandler = () => {
    this.changeMode();
    this.audioEngine.speakText('Modo ' + this.modes[this.selectedModeIndex]);
  }

  doublePressHandler = () => {
    this.warningsStatus[0] = !this.warningsStatus[0];
    this.audioEngine.speakText('Alerta ' + this.warnings[0] + ' ' + (this.warningsStatus[0] ? 'on' : 'off'));
  }


  triplePressHandler = () => {
    this.warningsStatus[1] = !this.warningsStatus[1];
    this.audioEngine.speakText('Alerta ' + this.warnings[1] + ' ' + (this.warningsStatus[1] ? 'on' : 'off'));
  }


  quadruplePressHandler = () => {
    // Mode none
    this.selectedModeIndex = 0;

    // Deactivate all warnings
    for (let wS in this.warningsStatus) {
      wS = false;
    }

    this.audioEngine.speakText('Todos los avisos y modos apagados.');
  }





  // Change mode
  changeMode = () => {
    this.selectedModeIndex = (this.selectedModeIndex + 1) % this.modes.length;
  }

  // Activate / deactivate warning
  onOffWarning = (warningIndex) => {
    this.warningsStatus[warningIndex] = !this.warningsStatus[warningIndex];
  }

}