import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const el = document.getElementById('map-bo');
if (el){
  const map = L.map('map-bo').setView([-16.5,-64.9], 5);
  const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);

  const canvasRenderer = L.canvas({ padding: 0.5 });
  const boUrl = el.getAttribute('data-bo-url') || '/geo/bo.json';
  fetch(boUrl)
  .then(r => r.ok ? r.json() : Promise.reject(new Error('No se pudo leer bo.json')))
    .then(geo => {
      const layer = L.geoJSON(geo, {
        style: () => ({ color:'#1565c0', weight: 1.3, fillColor:'#90caf9', fillOpacity: 0.25 }),
        renderer: canvasRenderer
      }).addTo(map);
      try { map.fitBounds(layer.getBounds(), { padding:[20,20] }); } catch(e) {}

      // Resumen informativo
      const feats = Array.isArray(geo.features) ? geo.features : [];
      const types = new Set();
      feats.forEach(f => {
        const t = f && f.geometry && f.geometry.type; if (t) types.add(t);
      });
      const info = document.getElementById('boInfo');
      if (info){
        info.style.display = 'block';
        info.innerHTML = `
          <div><b>Archivo:</b> /geo/bo.json</div>
          <div><b>Tipo:</b> FeatureCollection</div>
          <div><b>Features:</b> ${feats.length}</div>
          <div><b>Geometrías:</b> ${Array.from(types).join(', ') || '—'}</div>
        `;
      }
    })
    .catch(err => {
      console.error(err);
      const info = document.getElementById('boInfo');
  if (info){ info.style.display='block'; info.textContent = 'No se pudo cargar bo.json'; }
    });
}
