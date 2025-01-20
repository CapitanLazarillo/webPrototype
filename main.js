
const regattaData = await fetch('./regatta1.json').then(res => res.json());
const pointsOfInterest = await fetch('./pointsOfInterest.json').then(res => res.json()).then(file => file.data);

// Load boat data
const positions = regattaData.positions;

// Extract unique boat IDs
const boatIds = Object.keys(positions);//[...new Set(Object.values(positions).flat().map(p => p.i))];
const boatInternalIds = {};
for (let i = 0; i < boatIds.length; i++) {
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

// Create OL map features
let features = [];
for (let i = 0; i < pointsOfInterest.length; i++) {
  features[i] = new ol.Feature({
    geometry: new ol.geom.Point(ol.proj.fromLonLat(pointsOfInterest[i].location)),
  })
}
// Add buoys
for (let i = 0; i < regattaData.buoys.length; i++) {
  features.push(new ol.Feature({
    geometry: new ol.geom.Point(ol.proj.fromLonLat([regattaData.buoys[i].lng, regattaData.buoys[i].lat]))
  }));
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
let selectedBoat = "Zorba";
function centerOnBoat(id) {
  selectedBoat = id;
  // HTML change color
  const boatList = document.getElementById('boat-list');
  for (let i = 0; i < boatList.children.length; i++) {
    let ch = boatList.children[i];
    // Selected
    if (ch.innerText == id) {
      ch.classList.add("selected-boat");
    }
    // Not selected
    else {
      ch.classList.remove("selected-boat");
    }
  }

  // If track has not started yet
  let firstTmst = positions[id][1].t;
  if (firstTmst > currentTime) {
    currentTime = firstTmst;
    moveTimelineToTmst(currentTime);
  }
  // Center on boat
  // Find internal id
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

// Update time slider with arrow keys
document.addEventListener("keydown", (e) => {
  if (e.key == "ArrowRight") {
    slider.value = Math.min(currentTime + 1000 * 60 * 1, endTmst);
  } else if (e.key == "ArrowLeft") {
    slider.value = Math.max(currentTime - 1000 * 60 * 1, startTmst);
  }
  const virutalE = new Event("input");
  slider.dispatchEvent(virutalE);
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


function moveTimelineToTmst(tmst) {
  currentTime = tmst;
  updateBoatPositions(tmst);
  updateTimeline(tmst);
}










// UPDATE FUNCTION
let prevTime = performance.now();
let calcDistancesTimeout = 0.5; // seconds
let calcDistancesTimer = 0;
function updateTime() {
  if (!playing) return;
  let dt = performance.now() - prevTime;

  // In case of a long pause, clamp dt
  if (dt > 500) dt = 100;

  // Call interaction manager
  interactionManager.update(dt);

  // Playback speed
  currentTime += dt * speed; // Adjust time based on speed
  moveTimelineToTmst(currentTime);
  prevTime = performance.now();


  // Calculate distances with objects
  calcDistancesTimer += dt / 1000;
  if (calcDistancesTimer > calcDistancesTimeout) {
    calcDistancesTimer = 0;
    let distances = calculateDistancesAndBearings();
    // Call interaction manager
    interactionManager.updateDistances(distances);
  }




  requestAnimationFrame(updateTime);
}








// Event listeners for controls
document.getElementById('play').addEventListener('click', play);
document.getElementById('pause').addEventListener('click', pause);
document.getElementById('speed').addEventListener('change', e => {
  speed = parseInt(e.target.value);
});

// Initialize animation
moveTimelineToTmst(startTmst);
centerOnBoat(selectedBoat);

// Map click for tooltip
map.on('click', event => {
  const coords = ol.proj.toLonLat(event.coordinate);
  // Copy to clipboard
  let strToCopy = `{
    "type": "",
    "name": "",
    "location": [
        ${coords[0]},
        ${coords[1]}
      ]
    },`
  navigator.clipboard.writeText(strToCopy);
  alert(`Lat: ${coords[1]}, Lon: ${coords[0]}`);
});











// CALCULATE DISTANCES
function calculateDistancesAndBearings() {
  if (selectedBoat == undefined)
    return;

  let boatTrack = positions[selectedBoat].filter(p => p.t <= currentTime)
  let latest = boatTrack[boatTrack.length - 1];
  let latestPosition = [latest.n, latest.a];

  let distancesToOthers = [];
  // Points of Interest
  pointsOfInterest.forEach(poi => {
    distancesToOthers.push({
      type: poi.type,
      name: poi.name,
      location: poi.location,
      distance: calculateDistance(latestPosition, poi.location),
      relBearing: calculateRelBearing(latestPosition[0], latestPosition[1], poi.location[0], poi.location[1], latest.c)
    });
  });
  // Boats
  Object.keys(positions).forEach(kk => {
    if (kk != selectedBoat) {
      // Boat track
      let bT = positions[kk].filter(p => p.t <= currentTime);
      if (bT.length == 0)
        return;
      let l = bT[bT.length - 1];
      let lP = [l.n, l.a];
      // Distance
      distancesToOthers.push({
        type: "boat",
        name: kk,
        location: lP,
        distance: calculateDistance(latestPosition, lP),
        relBearing: calculateRelBearing(latestPosition[0], latestPosition[1], lP[0], lP[1], latest.c)
      })
    }
  });

  distancesToOthers.sort((a, b) => a.distance - b.distance);

  return distancesToOthers;
}


let tempLine = []; // Memory allocation
const calculateDistance = (lonLatA, lonLatB) => {
  tempLine[0] = ol.proj.fromLonLat(lonLatA);
  tempLine[1] = ol.proj.fromLonLat(lonLatB);
  const line = new ol.geom.LineString(tempLine);
  const distance = ol.sphere.getLength(line);
  return distance;
}



// CALCULATE BEARINGS
const calculateRelBearing = (lon1, lat1, lon2, lat2, bearing) => {
  let angle = calculateBearing(lon1, lat1, lon2, lat2);
  return (((angle - bearing) % 360) + 360) % 360;
}
const calculateBearing = (lon1, lat1, lon2, lat2) => {
  // Convert degrees to radians
  const toRadians = (degrees) => degrees * Math.PI / 180;
  const toDegrees = (radians) => radians * 180 / Math.PI;

  const φ1 = toRadians(lat1); // Latitude of point 1
  const φ2 = toRadians(lat2); // Latitude of point 2
  const Δλ = toRadians(lon2 - lon1); // Longitude difference

  // Compute the bearing
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  let θ = Math.atan2(y, x); // Bearing in radians

  // Convert to degrees and normalize to 0-360
  θ = toDegrees(θ);
  return (θ + 360) % 360;
}





// Interaction manager
const interactionManager = new InteractionManager();