
import { Mode, ModeNorth, ModeBearing, ModeHome} from './Mode.js';


export class InteractionManager {

  // Modes (constant reporting)
  modes = ["apagado", "norte", "rumbo", "amarre", "boia 1", "boia 2", "boia 3"];
  modeObjects = [];
  modeConstructors = ["", ModeNorth, ModeBearing, ModeHome, Mode, Mode, Mode];
  selectedModeIndex = 0;

  // Warnings
  warnings = ["proximidad", "objetos cercanos"]; // Escora should be here too
  warningsStatus = [false, false];
  // Warnings timing
  warningsPeriod = 10 * 1000; // seconds
  warningsTimer = 10 * 1000; // Start activated

  // Keydown timeout (time between key presses)
  keyTimeout = 300; // ms


  // Distances (calculated in main.js)
  distances;
  selfBearing = 0;

  constructor() {

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
            this.quadruplePressHandler();
          }
          pressCount = 0; // Reset the count after handling
        }, this.keyTimeout); // Adjust the delay (in milliseconds) to suit your needs
      }
    });
  }

  singlePressHandler = () => {
    this.changeMode();
    //this.audioEngine.speakText('Modo ' + this.modes[this.selectedModeIndex]);
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
    this.selectedModeIndex = 0;

    // Deactivate all warnings
    for (let wS in this.warningsStatus) {
      wS = false;
    }

    this.audioEngine.speakText('Todos los avisos y modos apagados.');
  }




  // INTERNAL FUNCTIONS
  // Change mode
  changeMode = () => {
    this.selectedModeIndex = (this.selectedModeIndex + 1) % this.modes.length;
    if (this.selectedModeIndex != 0)
      this.modeObjects[this.selectedModeIndex].modeActivated();
  }

  // Activate / deactivate warning
  onOffWarning = (warningIndex) => {
    this.warningsStatus[warningIndex] = !this.warningsStatus[warningIndex];
  }

  






  // UPDATE
  update(dt) {

    // Update mode
    if (this.selectedModeIndex != 0 && this.distances != undefined){
      // Home mode
      if (this.modes[this.selectedModeIndex] == 'amarre') {
        let distHomeArray = this.distances.filter(item => item.type == 'home');
        let distHome = distHomeArray[0];
        this.modeObjects[this.selectedModeIndex].update(dt, distHome.distance, distHome.relBearing);
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
          str += this.distances[0].name + ' a las ' + clockAngle1 + ' a ' + parseInt(this.distances[0].distance) + ' metros.';
          str += this.distances[1].name + ' a las ' + clockAngle2 + ' a ' + parseInt(this.distances[1].distance) + ' metros.';
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

}



export default InteractionManager