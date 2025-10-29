import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

(function(){
  const mapEl = document.getElementById('map-geodatos');
  if(!mapEl) return;

  const map = L.map('map-geodatos').setView([-16.5,-64.9], 5);
  // Capas base recomendadas (satélite y otras)
  const baseLayers = {
    'OSM Estándar': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }),
    'Esri Satélite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles © Esri — Sources: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }),
    'Esri Calles': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles © Esri — Source: Esri & contributors'
    }),
    'Esri Topo': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles © Esri — Source: Esri & contributors'
    }),
    'Carto Voyager': L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
      subdomains: 'abcd',
      attribution: '© OpenStreetMap contributors © CARTO'
    }),
    'OpenTopoMap': L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors, SRTM | © OpenTopoMap (CC-BY-SA)'
    })
  };
  let currentBase = baseLayers['OSM Estándar'].addTo(map);
  // Overlay opcional de etiquetas para satélite
  const labelsOverlay = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png', {
    subdomains: 'abcd',
    attribution: '© OpenStreetMap contributors © CARTO'
  });
  L.control.layers(baseLayers, { 'Etiquetas (CARTO)': labelsOverlay }, { position: 'topright', collapsed: true }).addTo(map);
  map.on('baselayerchange', (e) => { currentBase = e.layer; });

  // Control de atenuación sobre la base activa
  const worldOpacity = document.getElementById('worldOpacityGeodatos');
  if (worldOpacity){
    const att = parseFloat(worldOpacity.value||'0');
    currentBase.setOpacity(Math.max(0, Math.min(1, 1 - att)));
    worldOpacity.addEventListener('input', () => {
      const v = parseFloat(worldOpacity.value||'0');
      if (currentBase && currentBase.setOpacity){
        currentBase.setOpacity(Math.max(0, Math.min(1, 1 - v)));
      }
    });
  }

  const renderer = L.canvas({ padding: 0.5 });
  const groupsContainer = document.getElementById('groups');
  const dataScript = document.getElementById('geodata-index');
  let index = [];
  try { index = JSON.parse(dataScript?.textContent||'[]'); } catch(e){ index = []; }

  // Agrupar por 'group'
  const byGroup = new Map();
  index.forEach(item => {
    const g = item.group||'otros';
    if(!byGroup.has(g)) byGroup.set(g, []);
    byGroup.get(g).push(item);
  });

  const layers = new Map(); // url -> Leaflet layer
  // Modal refs
  const modal = document.getElementById('feature-modal');
  const modalBody = document.getElementById('feature-modal-body');
  const modalTitle = document.getElementById('feature-modal-title');
  const modalClose = document.getElementById('feature-modal-close');
  const modalBackdrop = modal ? modal.querySelector('.modal-backdrop') : null;

  function openModal(html, title){
    if (!modal || !modalBody) return;
    modalBody.innerHTML = html || '';
    if (modalTitle){
      if (title && String(title).trim()){
        modalTitle.textContent = String(title).trim();
        modalTitle.style.display = '';
      } else {
        modalTitle.textContent = '';
        modalTitle.style.display = 'none';
      }
    }
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }
  function closeModal(){
    if (!modal || !modalBody) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    modalBody.innerHTML = '';
  }
  modalClose && modalClose.addEventListener('click', closeModal);
  modalBackdrop && modalBackdrop.addEventListener('click', closeModal);
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  function drawSidebar(){
    groupsContainer.innerHTML = '';
    Array.from(byGroup.keys()).sort().forEach(g => {
      const sec = document.createElement('div'); sec.className = 'group';
      const h = document.createElement('h3'); h.textContent = g; sec.appendChild(h);
      const list = document.createElement('div');
      byGroup.get(g).forEach(item => {
        const row = document.createElement('div'); row.className = 'file-item';
        const cb = document.createElement('input'); cb.type='checkbox'; cb.dataset.url=item.url;
        const label = document.createElement('label');
        label.textContent = humanizeName(item.name);
        label.title = item.name;
        label.style.flex='1';
        cb.addEventListener('change', () => toggleLayer(item, cb.checked));
        row.appendChild(cb); row.appendChild(label); list.appendChild(row);
      });
      sec.appendChild(list);
      groupsContainer.appendChild(sec);
    });
  }

  function humanizeName(fileName){
    try{
      // 1) Base sin extensión
      let base = String(fileName || '').replace(/\.[^.]+$/, '');
      // 2) Tokens por separadores comunes
      let parts = base.split(/[-_.]+/).filter(Boolean);
      // 3) Remover prefijos de códigos frecuentes (ej: scz, lpz, bo, bol, etc.)
      const known = new Set(['bo','bol','scz','lpz','cbb','cbba','oru','ben','pnd','tja','chu','pt','potosi','potosí','pando','lapaz','la','paz']);
      if (parts.length > 1 && known.has(parts[0].toLowerCase())){
        parts.shift();
      }
      // 4) Remover tokens de escala/ruido
      const skip = new Set(['geojson','json','topojson','shp','1m','5m','10m','20m','50k','100k','250k','500k']);
      parts = parts.filter(p => !skip.has(p.toLowerCase()));
      // 5) Title Case simple
      const pretty = parts.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ').replace(/\s+/g,' ').trim();
      return pretty || fileName;
    }catch(e){
      return fileName;
    }
  }

  function toggleLayer(item, on){
    const url = item.url;
    if(on){
      if(layers.has(url)) return; // ya está
      fetch(url).then(r => r.json()).then(geo => {
        const layer = L.geoJSON(geo, {
          style: feature => styleForFeature(feature, item),
          pointToLayer: (feature, latlng) => pointStyle(feature, latlng),
          onEachFeature: (feature, lyr) => onEachFeature(item, feature, lyr),
          renderer
        }).addTo(map);
        layers.set(url, layer);
        try { map.fitBounds(layer.getBounds(), { padding:[20,20] }); } catch(e){}
      }).catch(e => {
        console.error('No se pudo cargar', url, e);
        alert('No se pudo cargar el archivo: ' + item.name);
        // apaga el checkbox si falló
        const cb = groupsContainer.querySelector(`input[type=checkbox][data-url="${CSS.escape(url)}"]`);
        if (cb) cb.checked = false;
      });
    } else {
      const layer = layers.get(url);
      if(layer){ map.removeLayer(layer); layers.delete(url); }
    }
  }

  function styleForFeature(feature, item){
    const t = feature?.geometry?.type || '';
    if (t.includes('Polygon')){
      return { color:'#0d47a1', weight: 1.2, fillColor:'#90caf9', fillOpacity: 0.35 };
    }
    if (t.includes('LineString')){
      const isHidro = (item?.group||'').toLowerCase().includes('hidro');
      if (isHidro){
        return { color:'rgb(38,186,165)', weight: 1.8 };
      }
      return { color:'#43a047', weight: 1.4 };
    }
    return { color:'#375f7a', weight: 1.5, fillColor:'#26baa5', fillOpacity: 0.4 };
  }

  function pointStyle(feature, latlng){
    return L.circleMarker(latlng, { radius: 10, color:'#375f7a', weight: 4, fillColor:'#26baa5', fillOpacity: 0.5 });
  }

  function onEachFeature(item, feature, layer){
    const t = feature?.geometry?.type || '';
    const props = feature?.properties || {};
    const name = extractName(props);

    // Ríos: etiquetas centradas sobre la línea (solo grupo 'hidro')
    const isHidro = (item.group||'').toLowerCase().includes('hidro');
    if (isHidro && t.includes('LineString')){
      if (!name) return;
      layer.bindTooltip(String(name), {
        permanent: true,
        direction: 'center',
        className: 'geodatos-label'
      });
      // Abrir modal con propiedades al clic
      const html = buildPopupBody(props);
      if (html) layer.on('click', () => openModal(html, name));
      return;
    }

    // Puntos (mercados/POIs): etiqueta al lado derecho, si hay nombre
    if (t === 'Point'){
      if (!name) return;
      layer.bindTooltip(String(name), {
        permanent: true,
        direction: 'right',
        offset: [12, 0],
        className: 'geodatos-point-label'
      });
      // Modal con propiedades al clic
      const html = buildPopupBody(props);
      if (html) layer.on('click', () => openModal(html, name));
      return;
    }
    if (t === 'MultiPoint'){
      if (!name) return;
      if (layer && typeof layer.eachLayer === 'function'){
        layer.eachLayer(child => {
          try{
            child.bindTooltip(String(name), {
              permanent: true,
              direction: 'right',
              offset: [12, 0],
              className: 'geodatos-point-label'
            });
            const html = buildPopupBody(props);
            if (html) child.on('click', () => openModal(html, name));
          }catch(e){}
        });
      }
      return;
    }
    // Para otras geometrías (polígonos, líneas no-hidro), permitir modal al clic si tiene datos
    const html = buildPopupBody(props);
    if (html) layer.on('click', () => openModal(html, name));
  }
  // Construir cuerpo "humano" del modal: alias de claves, filtrado y orden legible
  function buildPopupBody(props){
    if (!props || typeof props !== 'object') return '';
    const entries = [];
    for (const k of Object.keys(props)){
      if (hiddenKey(k)) continue;
      let v = props[k];
      if (v === null || v === undefined) continue;
      if (typeof v === 'object') v = JSON.stringify(v);
      let s = String(v).trim();
      if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'na') continue;
      const label = humanLabel(k);
      const weight = labelPriority(label);
      s = formatValue(s);
      entries.push({ k, label, value: s, weight });
    }
    if (!entries.length) return '';
    entries.sort((a,b) => a.weight - b.weight || a.label.localeCompare(b.label));
    let list = '';
    let count = 0;
    for (const e of entries){
      list += `<dt>${escapeHtml(e.label)}</dt><dd>${e.value}</dd>`; // e.value ya viene formateado/escapado
      if (++count >= 20) break;
    }
    return `<div class="popup-props"><dl>${list}</dl></div>`;
  }

  function humanLabel(key){
    const k = String(key||'').toLowerCase();
    const map = new Map([
      ['nombre','Nombre'], ['name','Nombre'], ['nom','Nombre'],
      ['tipo','Tipo'], ['category','Categoría'], ['categoria','Categoría'], ['cat','Categoría'],
      ['municipio','Municipio'], ['mun','Municipio'], ['muni','Municipio'], ['cod_mun','Código Municipio'],
      ['provincia','Provincia'], ['prov','Provincia'], ['cod_prov','Código Provincia'],
      ['departamento','Departamento'], ['depto','Departamento'], ['dpto','Departamento'], ['cod_dep','Código Departamento'],
      ['direccion','Dirección'], ['dirección','Dirección'], ['dir','Dirección'],
      ['telefono','Teléfono'], ['teléfono','Teléfono'], ['tel','Teléfono'],
      ['correo','Correo'], ['email','Email'],
      ['web','Sitio web'], ['url','Sitio web'],
      ['poblacion','Población'], ['población','Población'], ['pobl','Población'], ['pob','Población'],
      ['lat','Latitud'], ['latitude','Latitud'], ['y','Latitud'],
      ['lon','Longitud'], ['lng','Longitud'], ['longitud','Longitud'], ['x','Longitud'],
      ['fuente','Fuente'], ['source','Fuente'], ['anio','Año'], ['año','Año'],
      ['rio','Río'], ['río','Río'], ['river','Río'],
    ]);
    if (map.has(k)) return map.get(k);
    // Transformar otros: quitar guiones/bajos y title case
    const pretty = k.replace(/[_-]+/g,' ').trim();
    return pretty ? pretty.charAt(0).toUpperCase() + pretty.slice(1) : key;
  }

  function hiddenKey(key){
    const k = String(key||'').toLowerCase();
    const hidden = [
      'gid','fid','objectid','osm_id','id','uuid','uid',
      'shape_leng','shape_le_1','shape_length','shape_area','area','perimeter','geom','geometry',
    ];
    return hidden.includes(k);
  }

  function labelPriority(label){
    const order = [
      'Nombre','Tipo','Categoría','Dirección','Municipio','Provincia','Departamento',
      'Teléfono','Correo','Sitio web','Población','Año','Fuente','Latitud','Longitud'
    ];
    const idx = order.indexOf(label);
    return idx === -1 ? 100 : idx;
  }

  function formatValue(val){
    const s = String(val).trim();
    // URL clicable
    if (/^https?:\/\//i.test(s)){
      const esc = escapeHtml(s);
      let text = s.replace(/^https?:\/\//i,'');
      if (text.length > 40) text = text.slice(0, 37) + '…';
      return `<a href="${esc}" target="_blank" rel="noopener">${escapeHtml(text)}</a>`;
    }
    return escapeHtml(s);
  }

  function escapeHtml(str){
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function extractName(props){
    // Busca el primer campo de nombre no vacío
    const candidates = [
      'NOMBRE','Nombre','nombre',
      'NAME','Name','name',
      'RIO','Río','Rio','rio',
      'RIVER','River','river',
      'DESCRIPCION','Descripcion','descripcion','desc'
    ];
    for(const k of candidates){
      if (k in props){
        const v = props[k];
        if (v === null || v === undefined) continue;
        const s = String(v).trim();
        if(!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'na') continue;
        return s;
      }
    }
    return '';
  }

  // Botones extra
  const btnZoomAll = document.getElementById('btnZoomAll');
  if(btnZoomAll){
    btnZoomAll.addEventListener('click', () => {
      const bounds = [];
      layers.forEach(layer => { try { bounds.push(layer.getBounds()); } catch(e){} });
      if(!bounds.length) return;
      let acc = bounds[0];
      for(let i=1;i<bounds.length;i++){ acc = acc.extend(bounds[i]); }
      map.fitBounds(acc, { padding:[20,20] });
    });
  }
  const btnClear = document.getElementById('btnClear');
  if(btnClear){
    btnClear.addEventListener('click', () => {
      layers.forEach(layer => map.removeLayer(layer));
      layers.clear();
      groupsContainer.querySelectorAll('input[type=checkbox]').forEach(cb => cb.checked = false);
    });
  }

  drawSidebar();
})();
