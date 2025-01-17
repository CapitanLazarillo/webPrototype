
const regattaData = await fetch('./regatta1.json').then(res => res.json());

// Load boat data
const positions = regattaData.positions;

// Extract unique boat IDs
const boatIds = Object.keys(positions);//[...new Set(Object.values(positions).flat().map(p => p.i))];
const boatInternalIds = {};
for (let i = 0; i < boatIds.length; i++){
  boatInternalIds[positions[boatIds[i]][0].i] = boatIds[i];
} 

// Create Boat List
const boatList = document.getElementById('boat-list');
boatIds.forEach(id => {
  const listItem = document.createElement('button');
  listItem.textContent = `${id}`;
  listItem.addEventListener('click', () => centerOnBoat(id));
  boatList.appendChild(listItem);
});


// POINTS OF INTEREST
const pointsOfInterest = [
  {
    type: 'beacon',
    name: 'baliza babor',
    location: [2.198764, 41.381568],
  },
  {
    type: 'beacon',
    name: 'baliza estribor',
    location: [2.200617, 41.382582],
  },
  {
    type: 'rocks',
    name: 'espigón gas',
    location: [2.197363, 41.381189],
  },
  {
    type: 'rocks',
    name: 'espigón port olímpic',
    location: [2.198832, 41.383570],
  },
  {
    type: 'rocks',
    name: 'espigón somorrostro',
    location: [2.198291, 41.384392],
  },
  {
    type: 'beaching',
    name: 'salida playa somorrostro',
    location: [2.197920, 41.384699],
  }
]
// Create OL map features
let features = [];
for (let i = 0; i < pointsOfInterest.length; i++) {
  features[i] = new ol.Feature({
    geometry: new ol.geom.Point(ol.proj.fromLonLat(pointsOfInterest[i].location)),
  })
}








const map = new ol.Map({
  target: 'map',
  layers: [
    // BASE LAYER
    new ol.layer.Tile({
      source: new ol.source.XYZ({ // https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/0
        url: 'http://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}',
        attributions: 'Imatges ©2025 Google, Imatges ©2025 Airbus, Maxar Technologies, Dades del mapa ©2025 Inst. Geogr. Nacional',
        cacheSize: 500,
        crossOrigin: 'anonymous',
      })
    }),
    // POINTS OF INTEREST
    new ol.layer.Vector({
      source: new ol.source.Vector({
        features: features
      })
    })
  ],
  // VIEW
  view: new ol.View({
    center: ol.proj.fromLonLat([2.197277, 41.383162]),
    zoom: 18,
  }),
});



// Boat setup
// Add a vector layer for boats
const boatSource = new ol.source.Vector();
const boatLayer = new ol.layer.Vector({ source: boatSource });
map.addLayer(boatLayer);


// Center map on a selected boat
function centerOnBoat(id) {
  let intId = Object.keys(boatInternalIds).filter(intId => boatInternalIds[intId] == id)[0];
  const boatTrack = Object.values(positions).flat().filter(p => p.i === intId && p.t <= currentTime);
  if (boatTrack.length > 0) {
    const latest = boatTrack[boatTrack.length - 1];
    map.getView().setCenter(ol.proj.fromLonLat([latest.n, latest.a]));
    map.getView().setZoom(16); // Optional: Zoom to focus
  }
}






// OVERLAYS
const boatOverlays = []; // Store overlays for dynamic updates

function updateBoatPositionsWithHTML(time) {
  // Remove all existing overlays
  boatOverlays.forEach(overlay => map.removeOverlay(overlay));
  boatOverlays.length = 0;

  // Add new overlays for each boat
  Object.values(positions).forEach(tracks => {
    const track = tracks.filter(t => t.t <= time);
    if (track.length > 0) {
      const latest = track[track.length - 1];
      const coords = [latest.n, latest.a];
      const boatId = latest.i;
      const velocity = latest.s.toFixed(1);

      // Create a boat HTML element
      const boatElement = document.createElement('div');
      boatElement.className = 'boat-marker';
      boatElement.style.cursor = 'pointer';
      boatElement.style.rotate = latest.c + 'deg';
      boatElement.id = latest.i;
      

      // Add onclick event
      boatElement.onclick = () => {
        alert(`Boat: ${boatId}\nVelocity: ${velocity} m/s\nCoordinates: ${coords.join(', ')}`);
        centerOnBoat(boatId);
      };

      // Create an overlay for the boat
      const boatOverlay = new ol.Overlay({
        position: ol.proj.fromLonLat(coords),
        positioning: 'center-center',
        element: boatElement,
        stopEvent: false,
      });

      // Add overlay to map
      map.addOverlay(boatOverlay);
      boatOverlays.push(boatOverlay);
    }
  });
}



// Update boat positions
function updateBoatPositions(time) {
  updateBoatPositionsWithHTML(time);
  boatSource.clear();
  const secondsOfTrailBehind = 90;
  Object.values(positions).forEach(tracks => {
    const track = tracks.filter(t => t.t <= time && t.t > time - 1000 * secondsOfTrailBehind);
    if (track.length > 0) {
      const latest = track[track.length - 1];
      const boatFeature = new ol.Feature({
        geometry: new ol.geom.Point(ol.proj.fromLonLat([latest.n, latest.a])),
        name: `${boatInternalIds[latest.i]}`,
        velocity: `${latest.s.toFixed(1)} knts`,
        direction: `${latest.c}º`,
      });

      // Add style with label
      boatFeature.setStyle(
        new ol.style.Style({
          image: new ol.style.Circle({
            radius: 5,
            fill: new ol.style.Fill({ color: 'blue' }),
            stroke: new ol.style.Stroke({ color: 'white', width: 1 }),
          }),
          text: new ol.style.Text({
            text: `${boatFeature.get('name')} - ${boatFeature.get('velocity')}, ${boatFeature.get('direction')}`,
            offsetY: -25, // Position label above the boat
            font: '12px Calibri,sans-serif',
            fill: new ol.style.Fill({ color: '#000' }),
            stroke: new ol.style.Stroke({ color: '#fff', width: 3 }),
          }),
        })
      );

      boatSource.addFeature(boatFeature);

      // Draw trail
      const trailCoords = track.map(t => ol.proj.fromLonLat([t.n, t.a]));
      const trailFeature = new ol.Feature({
        geometry: new ol.geom.LineString(trailCoords),
      });
      boatSource.addFeature(trailFeature);
    }
  });
}



// Timeline Control
const startTmst = Math.min(...Object.values(positions).flat().map(p => p.t));
const endTmst = Math.max(...Object.values(positions).flat().map(p => p.t));
const slider = document.getElementById('timeline-slider');
const currentTimestamp = document.getElementById('current-timestamp');

// Set timeline range
slider.min = startTmst;
slider.max = endTmst;
slider.value = startTmst;

// Update timeline and map
slider.addEventListener('input', () => {
  const selectedTime = parseInt(slider.value, 10);
  currentTime = selectedTime;
  const date = new Date(selectedTime);
  currentTimestamp.textContent = date.toISOString().split('T')[1].split('.')[0]; // Display HH:MM:SS
  updateBoatPositions(selectedTime);
});

function updateTimeline(time) {
  slider.value = time;
  const date = new Date(time);
  currentTimestamp.textContent = date.toISOString().split('T')[1].split('.')[0]; // Display HH:MM:SS
}



// Timeline control
let currentTime = Math.min(...Object.values(positions).flat().map(p => p.t));
let speed = 1;
let playing = false;

function play() {
  playing = true;
  requestAnimationFrame(updateTime);
}

function pause() {
  playing = false;
}

let prevTime = performance.now();
function updateTime() {
  if (!playing) return;
  let dt = performance.now() - prevTime;
  if (dt > 500) dt = 100;
  currentTime += dt * speed; // Adjust time based on speed
  updateBoatPositions(currentTime);
  updateTimeline(currentTime);
  prevTime = performance.now();
  requestAnimationFrame(updateTime);
}

// Event listeners for controls
document.getElementById('play').addEventListener('click', play);
document.getElementById('pause').addEventListener('click', pause);
document.getElementById('speed').addEventListener('change', e => {
  speed = parseInt(e.target.value);
});

// Initialize animation
updateBoatPositions(startTmst);
updateTime();

// Map click for tooltip
map.on('click', event => {
  const coords = ol.proj.toLonLat(event.coordinate);
  alert(`Lat: ${coords[1]}, Lon: ${coords[0]}`);
});



// CALCULATE DISTANCES
let tempLine = []; // Memory allocation
const calculateDistance = (lonLatA, lonLatB) => {
  tempLine[0] = lonLatA;
  tempLine[1] = lonLatB;
  const line = new ol.geom.LineString(tempLine);
  const distance = ol.sphere.getLength(line);
  return distance;
}