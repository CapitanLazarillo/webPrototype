

class InteractionManager {

  // Modes (constant reporting)
  modes = ["none", "norte", "amarre", "boia 1", "boia 2", "boia 3"];
  selectedModeIndex = 0;

  // Warnings
  warnings = ["proximity", "closest object"]; // Escora should be here too
  warningsStatus = [false, false];

  // Keydown timeout (time between key presses)
  keyTimeout = 300; // ms

  constructor() {

    // Space down interaction
    this.createEventBindings();

  }

  // USER EVENTS
  // Event binding
  createEventBindings = () => {
    let pressCount = 0;
    document.addEventListener('keydown', (event) => {
      if (event.code === 'Space') { // Check if the pressed key is the spacebar
        pressCount++;

        clearTimeout(timeout); // Clear any existing timeout to reset the detection window

        timeout = setTimeout(() => {
          if (pressCount === 1) {
            singlePressHandler();
          } else if (pressCount === 2) {
            doublePressHandler();
          } else if (pressCount === 3) {
            triplePressHandler();
          }
          else if (pressCount > 3) {
            quadruplePressHandler();
          }
          pressCount = 0; // Reset the count after handling
        }, this.keyTimeout); // Adjust the delay (in milliseconds) to suit your needs
      }
    });
  }

  singlePressHandler = () => {
    this.changeMode();
  }

  doublePressHandler = () => {
    this.warningsStatus[0] = !this.warningsStatus[0];
  }


  triplePressHandler = () => {
    this.warningsStatus[1] = !this.warningsStatus[1];
  }


  quadruplePressHandler = () => {
    // Mode none
    this.selectedModeIndex = 0;

    // Deactivate all warnings
    for (let wS in this.warningsStatus) {
      wS = false;
    }
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