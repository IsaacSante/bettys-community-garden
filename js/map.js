// 1. Prevent Leaflet "Map container is already initialized" error on live reload
const mapContainer = document.getElementById('garden-map');
if (mapContainer._leaflet_id) {
    mapContainer._leaflet_id = null;
}

// 2. Initialize the map with flat pixel grid
const map = L.map('garden-map', {
    crs: L.CRS.Simple,
    minZoom: -2,
    maxZoom: 2,
    zoomControl: true
});

// 3. Set your master dimensions (must match your Illustrator artboard)
const imageWidth = 2000;  
const imageHeight = 1500; 
const bounds = [[0, 0], [imageHeight, imageWidth]];

// 4. Add the watercolor background image
L.imageOverlay('assets/watercolor-map v4 to leaflet.png', bounds).addTo(map);

// 5. Load your Illustrator SVG tree shapes as an overlay
fetch('assets/TO LEAFLET.svg')
    .then(response => response.text())
    .then(svgText => {
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
        const svgElement = svgDoc.querySelector('svg');

        L.svgOverlay(svgElement, bounds, {
            interactive: false,
            opacity: 0.6
        }).addTo(map);
    })
    .catch(error => console.error("Error loading tree SVG:", error));

// 6. Your Named Feature Coordinates Data
const gardenFeatures = [
    { name: "Oak behind compost 1", x: 267.6165, y: -553.1908 },
    { name: "Oak behind compost 2", x: 173.4990, y: -498.7894 },
    { name: "Back bamboo", x: 38.9581, y: -403.2021 },
    { name: "Apricot", x: -44.1005, y: -401.7106 },
    { name: "Japanese pear", x: -159.7436, y: -312.4701 },
    { name: "Back left oak", x: -260.6738, y: -421.0352 },
    { name: "Large pear", x: -421.0352, y: -421.0352 },
    { name: "Rosebush compost", x: 69.4736, y: 69.4736 },
    { name: "Reiko cherry tree", x: 78.2454, y: -311.1107 },
    { name: "Tree left of Reiko cherry", x: 232.1572, y: -288.6619 },
    { name: "Memorial plot", x: -288.6619, y: -202.5645 },
    { name: "Fig tree", x: 255.3505, y: -227.8225 },
    { name: "Yew tree", x: 342.3696, y: -338.2971 },
    { name: "Primary cherry tree", x: 401.3876, y: -442.4849 },
    { name: "Sour cherry tree", x: -442.4849, y: -400.1010 },
    { name: "Back of shed mulberry tree", x: 669.9989, y: -541.5595 },
    { name: "Pomegranate tree", x: 568.7266, y: -369.6119 },
    { name: "Apple tree", x: 588.4333, y: -319.3040 },
    { name: "Mulberry tree by cats", x: 763.8660, y: -415.9008 },
    { name: "Oak cat tree", x: 870.1389, y: -420.9462 },
    { name: "Bamboo cats", x: 772.0861, y: -273.2840 },
    { name: "Hemlock tree", x: -273.2840, y: -365.3517 },
    { name: "Bottom right gazebo bush", x: 530.2420, y: -241.2392 },
    { name: "Bottom left gazebo bush", x: 478.0593, y: -226.2232 },
    { name: "Gate rose bush", x: 486.3064, y: -149.4308 },
    { name: "Mulberry gate", x: 370.0855, y: -190.0862 },
    { name: "Boxwood", x: 357.5077, y: -214.9901 },
    { name: "Cedar right 1", x: 508.2470, y: -198.0433 },
    { name: "Cedar right 2", x: 537.2832, y: -206.2990 },
    { name: "Cedar right 3", x: 563.3521, y: -218.6249 },
    { name: "Cedar right 4", x: 592.7337, y: -226.4669 },
    { name: "Cedar left 1", x: 135.4633, y: -38.2344 },
    { name: "Cedar left 2", x: 165.5691, y: -57.7806 },
    { name: "Cedar left 3", x: 195.4764, y: -69.6640 },
    { name: "Cedar left 4", x: 226.8098, y: -80.2283 },
    { name: "Yew bottom left", x: -71.0551, y: 65.7200 },
    { name: "Yew bottom top left", x: -134.1050, y: -17.0849 }
];

// 7. Plot features with 90-degree counter-clockwise rotation + offsets
// Scale multipliers to stretch the spread (try adjusting these between 1.0 and 2.0)
const scaleX = 1.3; // Stretches width horizontally
const scaleY = 1.3; // Stretches height vertically

// Position offsets to place the grid on the canvas
const offsetX = 600; 
const offsetY = 290; 

gardenFeatures.forEach(feature => {
    // 1. Scale the raw coordinate to stretch the distance between points
    // 2. Invert Y (-feature.y) and apply offsets
    const mappedX = (feature.x * scaleX) + offsetX;
    const mappedY = (-feature.y * scaleY) + offsetY;

    L.circleMarker([mappedY, mappedX], {
        radius: 6,
        color: '#1a3326',
        fillColor: '#4e8a64',
        fillOpacity: 0.8,
        weight: 2
    }).addTo(map)
      .bindTooltip(feature.name, { 
          permanent: true, 
          direction: 'top',
          className: 'garden-label' 
      })
      .bindPopup(`
          <div class="archive-popup">
              <h3>${feature.name}</h3>
              <audio controls preload="metadata">
                  <source src="assets/audio/reiko-cherry.mp3" type="audio/mpeg">
                  Your browser does not support audio.
              </audio>
          </div>
      `);
});

map.fitBounds(bounds);
