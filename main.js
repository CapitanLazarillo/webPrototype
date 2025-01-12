
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
for (let i = 0; i < pointsOfInterest.length; i++){
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


// CALCULATE DISTANCES
let tempLine = []; // Memory allocation
const calculateDistance = (lonLatA, lonLatB) => {
  tempLine[0] = lonLatA;
  tempLine[1] = lonLatB;
  const line = new ol.geom.LineString(tempLine);
  const distance = ol.sphere.getLength(line);
  return distance;
}