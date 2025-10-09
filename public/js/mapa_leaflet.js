import L from 'leaflet';
import { jsPDF } from 'jspdf';
import 'leaflet/dist/leaflet.css';
import leafletImage from 'leaflet-image';

// Cargar el GeoJSON; puedes moverlo a public/ o importarlo como módulo
// Ejemplo mínimo embebido (solo 2 polígonos ficticios simplificados):
const boliviaGeoJSON = {
  "type":"FeatureCollection",
  "features":[
    {"type":"Feature","properties":{"name":"La Paz","id":"lp"},
     "geometry":{"type":"Polygon","coordinates":[[[-68.9,-16.3],[-68.5,-15.8],[-67.9,-16.0],[-68.2,-16.5],[-68.9,-16.3]]]}},
    {"type":"Feature","properties":{"name":"Cochabamba","id":"co"},
     "geometry":{"type":"Polygon","coordinates":[[[-66.6,-17.7],[-66.0,-17.1],[-65.4,-17.4],[-65.9,-17.9],[-66.6,-17.7]]]}}
  ]
};

// Paleta inicial
const deptColors = {};
boliviaGeoJSON.features.forEach(f => {
  deptColors[f.properties.id] = {
    fill: randomColor(),
    stroke: '#222222',
    text: '#000000'
  };
});

let currentDept = null;

// Mapa centrado en Bolivia (aprox)
const map = L.map('map').setView([-16.5, -64.9], 5);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution:'© OpenStreetMap contributors'
}).addTo(map);

// Capa GeoJSON
const geoLayer = L.geoJSON(boliviaGeoJSON, {
  style: feature => styleFor(feature),
  onEachFeature: (feature, layer) => {
    layer.on('click', () => {
      currentDept = feature.properties.id;
      syncButtons();
    });
  }
}).addTo(map);

// Etiquetas (centroides)
geoLayer.eachLayer(layer => {
  const f = layer.feature;
  const center = layer.getBounds().getCenter();
  const divIcon = L.divIcon({
    className: 'dept-label',
    html: `<span class="label" data-id="${f.properties.id}">${f.properties.name}</span>`
  });
  L.marker(center, { icon: divIcon, interactive:false }).addTo(map);
});

function styleFor(feature) {
  const c = deptColors[feature.properties.id];
  return {
    color: c.stroke,
    weight: 1.2,
    fillColor: c.fill,
    fillOpacity: 0.8
  };
}

function refreshStyles() {
  geoLayer.setStyle(f => styleFor(f));
  // Cambiar color de texto
  document.querySelectorAll('.dept-label .label').forEach(span => {
    const id = span.getAttribute('data-id');
    span.style.color = deptColors[id].text;
  });
}

function syncButtons() {
  document.querySelectorAll('.dept-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.id === currentDept);
  });
  if (currentDept) {
    const c = deptColors[currentDept];
    fillInput.value = c.fill;
    strokeInput.value = c.stroke;
    textInput.value = c.text;
  }
}

// Panel dinámico
const btnsContainer = document.getElementById('departamentosBtns');
boliviaGeoJSON.features.forEach(f => {
  const b = document.createElement('button');
  b.textContent = f.properties.name;
  b.className = 'dept-btn';
  b.dataset.id = f.properties.id;
  b.onclick = () => { currentDept = f.properties.id; syncButtons(); };
  btnsContainer.appendChild(b);
});
currentDept = boliviaGeoJSON.features[0].properties.id;
syncButtons();

// Inputs
const fillInput = document.getElementById('colorFill');
const strokeInput = document.getElementById('colorStroke');
const textInput = document.getElementById('colorText');

fillInput.oninput = () => updateCurrent('fill', fillInput.value);
strokeInput.oninput = () => updateCurrent('stroke', strokeInput.value);
textInput.oninput = () => updateCurrent('text', textInput.value);

function updateCurrent(prop, val) {
  if(!currentDept) return;
  deptColors[currentDept][prop] = val;
  refreshStyles();
}

function randomColor() {
  return '#'+Math.floor(Math.random()*0xFFFFFF).toString(16).padStart(6,'0');
}

refreshStyles();

// Exportar a PNG
document.getElementById('btnExportPNG').onclick = () => {
  leafletImage(map, function(err, canvas) {
    if(err) { console.error(err); return; }
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'bolivia.png';
    a.click();
  });
};

// Exportar a PDF (jsPDF)
document.getElementById('btnExportPDF').onclick = () => {
  leafletImage(map, function(err, canvas) {
    const pdf = new jsPDF({orientation:'landscape', unit:'px', format:[canvas.width, canvas.height]});
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save('bolivia.pdf');
  });
};