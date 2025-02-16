
import { Mode, ModeNorth, ModeBearing, ModeHome, ModeBuoy } from './Mode.js';


export class InteractionManager {

  // Modes (constant reporting)
  modes = ["apagado", "norte", "rumbo", "amarre", "boya 1", "boya 2", "boya 3"];
  modeObjects = [];
  modeConstructors = ["", ModeNorth, ModeBearing, ModeHome, ModeBuoy, ModeBuoy, ModeBuoy];
  selectedModeIndex = 0;

  // Warnings
  warnings = ["proximidad", "objetos cercanos"]; // Escora should be here too
  warningsStatus = [false, false];
  // Warnings timing
  warningsPeriod = 10 * 1000; // seconds
  warningsTimer = 10 * 1000; // Start activated

  // Keydown timeout (time between key presses)
  keyTimeout = 300; // ms
  pressCount = 0;
  timeout;


  // Distances (calculated in main.js)
  distances;
  selfBearing = 0;

  constructor(forceDistanceCalculations) {
    this.forceDistanceCalculations = forceDistanceCalculations;
    // Create audio engine
    this.audioEngine = new AudioEngine();

    // Create Mode objects
    this.modeObjects = [undefined]; // off
    for (let i = 1; i < this.modes.length; i++) {
      let mConst = this.modeConstructors[i];
      this.modeObjects[i] = new mConst(this.modes[i], 5, this.audioEngine);
    }


    // Keydown (space) interaction
    this.createEventBindings();



  }

  // USER EVENTS
  // Event binding
  createEventBindings = () => {
    // Keydown
    document.addEventListener('keydown', (event) => {
      if (event.code === 'Space') { // Check if the pressed key is the spacebar
        this.pressButtonManager();
      }
    });
    // Button emulator
    document.getElementById("button-emulator").addEventListener("click", () => {
      this.pressButtonManager();
    })

  }


  pressButtonManager = () => {
    this.pressCount++;

    clearTimeout(this.timeout); // Clear any existing timeout to reset the detection window

    this.timeout = setTimeout(() => {
      if (this.pressCount === 1) {
        this.singlePressHandler();
      } else if (this.pressCount === 2) {
        this.doublePressHandler();
      } else if (this.pressCount === 3) {
        this.triplePressHandler();
      }
      else if (this.pressCount > 3) {
        this.quadruplePressHandler();
      }
      this.pressCount = 0; // Reset the count after handling
    }, this.keyTimeout); // Adjust the delay (in milliseconds) to suit your needs
  }

  singlePressHandler = () => {
    // Update distances
    this.forceDistanceCalculations();
    // Change mode
    this.changeMode();
  }

  doublePressHandler = () => {
    this.warningsStatus[0] = !this.warningsStatus[0];
    this.audioEngine.speakText('Alerta ' + this.warnings[0] + ' ' + (this.warningsStatus[0] ? 'activado' : 'desactivado'));
  }

  triplePressHandler = () => {
    this.warningsStatus[1] = !this.warningsStatus[1];
    this.audioEngine.speakText('Alerta ' + this.warnings[1] + ' ' + (this.warningsStatus[1] ? 'activado' : 'desactivado'));
  }

  quadruplePressHandler = () => {
    // Mode none
    this.setMode("apagado");

    // Deactivate all warnings
    for (let i = 0; i < this.warningsStatus.length; i++) {
      this.warningsStatus[i] = false;
    }

    this.audioEngine.speakText('Todos los avisos y modos apagados.');
  }




  // INTERNAL FUNCTIONS
  // Change mode
  changeMode = () => {
    this.selectedModeIndex = (this.selectedModeIndex + 1) % this.modes.length;
    if (this.selectedModeIndex != 0)
      this.modeObjects[this.selectedModeIndex].modeActivated();
    else
      this.audioEngine.speakText('Modo apagado', true);
    // Update html
    this.updateHTML();
  }

  // Activate / deactivate warning
  onOffWarning = (warningIndex) => {
    this.warningsStatus[warningIndex] = !this.warningsStatus[warningIndex];
  }



  updateHTML() {
    const modesList = document.getElementById('modes-list');
    for (let i = 0; i < modesList.children.length; i++) {
      let ch = modesList.children[i];
      // Selected
      if (ch.innerText == this.modes[this.selectedModeIndex]) {
        ch.classList.add("selected-boat");
      }
      // Not selected
      else {
        ch.classList.remove("selected-boat");
      }
    }
  }




  // UPDATE
  update(dt) {

    // Update mode
    if (this.selectedModeIndex != 0 && this.distances != undefined) {
      // Home mode
      if (this.modes[this.selectedModeIndex] == 'amarre') {
        let distHomeArray = this.distances.filter(item => item.type == 'home');
        let distHome = distHomeArray[0];
        this.modeObjects[this.selectedModeIndex].update(dt, distHome.distance, distHome.relBearing);
      }
      // Buoys
      else if (this.modes[this.selectedModeIndex].includes("boya")) {
        let distBuoyArray = this.distances.filter(item => item.name == this.modes[this.selectedModeIndex]);
        let distBuoy = distBuoyArray[0];
        this.modeObjects[this.selectedModeIndex].update(dt, distBuoy.distance, distBuoy.relBearing);
      }
      // Other modes
      else
        this.modeObjects[this.selectedModeIndex].update(dt, this.selfBearing);
    }

    if (this.warningsStatus[1]) { // Close objects
      this.warningsTimer += dt;
      if (this.warningsTimer > this.warningsPeriod) {
        console.log("Warning close objects");
        this.warningsTimer = 0;
        if (this.distances != undefined) {
          let clockAngle1 = degreesToClockNumber(this.distances[0].relBearing);
          let clockAngle2 = degreesToClockNumber(this.distances[1].relBearing);

          let str = '';
          str += this.distances[0].name + ' a las ' + clockAngle1 + ' a ' + distanceConversion(this.distances[0].distance);
          str += this.distances[1].name + ' a las ' + clockAngle2 + ' a ' + distanceConversion(this.distances[1].distance);
          this.audioEngine.speakText(str);
        }

      }
    }
  }




  // PUBLIC FUNCTIONS
  updateDistances(distances) {
    this.distances = distances;
  }
  updateBearing(angle) {
    this.selfBearing = angle;
  }

  // Set mode
  setMode(modeId) {
    let modeIdx = this.modes.indexOf(modeId);
    if (modeIdx == -1) {
      debugger;
    }

    this.selectedModeIndex = modeIdx;
    if (this.selectedModeIndex != 0)
      this.modeObjects[this.selectedModeIndex].modeActivated();
    else
      this.audioEngine.speakText('Modo apagado', true);

    // Update html
    this.updateHTML();
  }

}



export default InteractionManager