
const map = L.map('garden-map', {
    crs: L.CRS.Simple,
    minZoom: -1,
    maxZoom: 2,
    zoomControl: true
});


const imgWidth = 2000;
const imgHeight = 1500;
const bounds = [[0, 0], [imgHeight, imgWidth]];


const imageOverlay = L.imageOverlay('assets/watercolor-map.jpg', bounds).addTo(map);
map.fitBounds(bounds);


const gardenFeatures = [
    {
        name: "Reiko's Cherry Tree",
        coords: [1200, 800], // [y, x] relative to image dimensions
        audioSrc: "assets/audio/reiko-cherry.mp3",
        notes: "Requires specific pruning protocols in late winter."
    },
    {
        name: "Sèhsapsink Corn Plot",
        coords: [600, 400],
        audioSrc: null,
        notes: "Traditional planting block. Avoid compacting soil."
    },
    {
        name: "Tromboncino Trellis",
        coords: [900, 1500],
        audioSrc: null,
        notes: "Monitor rapid vine growth through mid-summer."
    }
];


gardenFeatures.forEach(feature => {
    const marker = L.circleMarker(feature.coords, {
        color: '#111',
        fillColor: '#e0ff4f',
        fillOpacity: 1,
        radius: 8,
        weight: 2
    }).addTo(map);

    let popupContent = `
        <div class="popup-content">
            <h3>${feature.name}</h3>
            <p style="margin:0;">${feature.notes}</p>
    `;
    
    if (feature.audioSrc) {
        popupContent += `
            <audio controls style="width: 200px; height: 30px; margin-top: 15px;">
                <source src="${feature.audioSrc}" type="audio/mpeg">
            </audio>
        `;
    }
    
    popupContent += `</div>`;
    marker.bindPopup(popupContent);
});
