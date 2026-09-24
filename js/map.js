// 1. Prevent Leaflet "Map container is already initialized" error on live reload
const mapContainer = document.getElementById('garden-map');
if (mapContainer._leaflet_id) {
    mapContainer._leaflet_id = null;
}

// 2. Master dimensions: must match the PNG's real pixel size AND the SVG's viewBox
//    (both are 1280 x 918). If these don't match the artwork, Leaflet stretches the
//    image and anything drawn on top of it drifts out of alignment.
const imageWidth = 1280;
const imageHeight = 918;
const bounds = [[0, 0], [imageHeight, imageWidth]];

// 3. Initialize the map with a flat pixel grid
const map = L.map('garden-map', {
    crs: L.CRS.Simple,
    minZoom: -2,
    maxZoom: 2,
    zoomSnap: 0.25,
    maxBounds: L.latLngBounds(bounds).pad(0.25),
    zoomControl: true
});

// 4. Add the watercolor background image
L.imageOverlay('assets/watercolor-map v4 to leaflet.png', bounds).addTo(map);
map.fitBounds(bounds);

// 5. Species and plant data live in js/garden-data.js (loaded before this file).

// A shape gets a permanent label once it's drawn at least this wide on screen,
// so big trees are labeled when zoomed out and small shrubs appear as you zoom in.
const LABEL_MIN_WIDTH_PX = 70;

const debug = new URLSearchParams(location.search).has('debug');

function labelFor(feature) {
    return feature.species ? species[feature.species].name : feature.name;
}

// One shape can hold several plants; each gets its own heading in the popup
function popupHtml(features) {
    const entries = features.map(feature => {
        const kind = feature.species && species[feature.species];
        return `
            <h3>${kind ? kind.name : feature.name}</h3>
            ${kind ? `<p class="popup-location">${feature.name}</p>
            <p><a href="${kind.care}" target="_blank" rel="noopener">Care instructions &rarr;</a></p>` : ''}`;
    }).join('');
    return `
        <div class="archive-popup">
            ${entries}
            <audio controls preload="metadata">
                <source src="assets/audio/reiko-cherry.mp3" type="audio/mpeg">
                Your browser does not support audio.
            </audio>
        </div>
    `;
}

// Center of a shape's bounding box, converted from SVG pixels (y down) to map coords (y up)
function shapeCenter(el) {
    const box = el.getBBox();
    return L.latLng(imageHeight - (box.y + box.height / 2), box.x + box.width / 2);
}

// 6. Load the tree outlines as a live, hoverable SVG layer that shares the image's bounds
// no-cache: always check for a newer export instead of reusing a stale copy
fetch('assets/TO LEAFLET.svg', { cache: 'no-cache' })
    .then(response => response.text())
    .then(svgText => {
        const svgElement = new DOMParser()
            .parseFromString(svgText, 'image/svg+xml')
            .querySelector('svg');

        // Drop Illustrator's embedded <style>: its .cls-1 rules would leak into the page.
        // Shapes are styled by .garden-shape in css/styles.css instead.
        svgElement.querySelectorAll('style').forEach(s => s.remove());

        // The overlay itself ignores the mouse (so dragging the map still works);
        // each .garden-shape opts back in via pointer-events in the CSS.
        L.svgOverlay(svgElement, bounds).addTo(map);

        const shapes = [...svgElement.querySelectorAll('path, polygon')];
        const hoverTip = L.tooltip({ direction: 'top', className: 'garden-label', offset: [0, -8] });
        const labeled = [];

        shapes.forEach((el, index) => {
            const features = gardenFeatures.filter(f =>
                (f.id && f.id === el.id) || f.shape === index
            );
            el.removeAttribute('class');
            el.classList.add('garden-shape');
            if (!features.length && !debug) {
                el.classList.add('is-unnamed');
                return;
            }

            const label = features.length ? features.map(labelFor).join('<br>') : 'Unnamed shape';
            const center = shapeCenter(el);
            const labelText = debug ? `#${index} ${label}` : label;
            const pinned = L.tooltip({ permanent: true, direction: 'center', className: 'garden-label is-pinned' })
                .setLatLng(center).setContent(labelText);
            labeled.push({ el, pinned, width: el.getBBox().width });

            el.addEventListener('mouseenter', () => {
                el.classList.add('is-active');
                if (!map.hasLayer(pinned)) {
                    hoverTip.setLatLng(center).setContent(labelText);
                    map.openTooltip(hoverTip);
                }
            });
            el.addEventListener('mouseleave', () => {
                el.classList.remove('is-active');
                map.closeTooltip(hoverTip);
            });
            if (features.length) {
                el.addEventListener('click', event => {
                    L.DomEvent.stopPropagation(event);
                    map.closeTooltip(hoverTip);
                    L.popup().setLatLng(center).setContent(popupHtml(features)).openOn(map);
                });
            }

            if (debug) {
                L.marker(center, {
                    interactive: false,
                    icon: L.divIcon({ className: 'shape-index', html: index, iconSize: null })
                }).addTo(map);
            }
        });

        // Show or hide each permanent label depending on how big its shape is at this zoom
        function updateLabels() {
            const scale = map.getZoomScale(map.getZoom(), 0);
            labeled.forEach(({ pinned, width }) => {
                const show = width * scale >= LABEL_MIN_WIDTH_PX;
                if (show && !map.hasLayer(pinned)) map.openTooltip(pinned);
                if (!show && map.hasLayer(pinned)) map.closeTooltip(pinned);
            });
        }
        map.on('zoomend', updateLabels);
        updateLabels();
    })
    .catch(error => console.error("Error loading tree SVG:", error));
