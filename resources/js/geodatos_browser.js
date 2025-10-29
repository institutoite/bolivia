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

  // Resalta una capa (aumenta weight/fillOpacity y la trae al frente)
  function highlightLayer(url, item){
    if(!layers.has(url)) return;
    try{
      const layer = layers.get(url);
      if(!layer) return;
      if (typeof layer.setStyle === 'function'){
        layer.setStyle(feature => {
          const base = styleForFeature(feature, item) || {};
          return Object.assign({}, base, {
            weight: Math.max(2, (base.weight || 1.5) * 2.2),
            fillOpacity: Math.min(1, (base.fillOpacity || 0.35) + 0.6),
            color: base.color || '#375f7a'
          });
        });
      } else if (typeof layer.eachLayer === 'function'){
        layer.eachLayer(child => {
          try{
            if (child.setStyle) child.setStyle(feature => {
              const base = styleForFeature(feature, item) || {};
              return Object.assign({}, base, {
                weight: Math.max(2, (base.weight || 1.5) * 2.2),
                fillOpacity: Math.min(1, (base.fillOpacity || 0.35) + 0.6),
                color: base.color || '#375f7a'
              });
            });
            // Si es un circleMarker, aumentar temporalmente su radio para resaltar
            try{
              if (typeof child.setRadius === 'function'){
                const orig = (child.options && child.options._origRadius) || (child.options && child.options.radius) || null;
                if (orig){
                  const newR = Math.min(30, Math.max(2, orig * 1.8));
                  child.setRadius(newR);
                }
              }
            }catch(e){}
            if (child.bringToFront) child.bringToFront();
          }catch(e){}
        });
      }
    }catch(e){ }
  }

  // Restaura estilos originales
  function restoreLayer(url, item){
    if(!layers.has(url)) return;
    try{
      const layer = layers.get(url);
      if(!layer) return;
      if (typeof layer.setStyle === 'function'){
        layer.setStyle(feature => styleForFeature(feature, item));
      } else if (typeof layer.eachLayer === 'function'){
        layer.eachLayer(child => {
          try{
            if (child.setStyle) child.setStyle(feature => styleForFeature(feature, item));
            // Restaurar radio original si aplica
            try{
              if (typeof child.setRadius === 'function'){
                const orig = (child.options && child.options._origRadius) || (child.options && child.options.radius) || null;
                if (orig) child.setRadius(orig);
              }
            }catch(e){}
          }catch(e){}
        });
      }
    }catch(e){}
  }

  const renderer = L.canvas({ padding: 0.5 });
  const groupsContainer = document.getElementById('groups');
  const dataScript = document.getElementById('geodata-index');
  let index = [];
  try { index = JSON.parse(dataScript?.textContent||'[]'); } catch(e){ index = []; }

  // Configurables para etiquetas
  const LABEL_PERMANENT_THRESHOLD = 50; // si la capa tiene <= this many puntos, mostrar nombres desde el inicio
  const LABEL_ZOOM_THRESHOLD = 12; // si la capa tiene muchos puntos, mostrar nombres solo a partir de este zoom
  const LABEL_MIN_FONT = 11; // px
  const LABEL_MAX_FONT = 16; // px

  // Agrupar por 'group'
  const byGroup = new Map();
  index.forEach(item => {
    const g = item.group||'otros';
    if(!byGroup.has(g)) byGroup.set(g, []);
    byGroup.get(g).push(item);
  });

  const layers = new Map(); // url -> Leaflet layer
  // Nota: mantenemos layers como url->layer. Al crear la UI añadimos handlers de hover
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
        // Asociamos el checkbox con el label mediante id para accesibilidad
        const id = 'cb_' + Math.random().toString(36).slice(2,9);
        cb.id = id; cb.dataset.url = item.url;
        const label = document.createElement('label');
        label.htmlFor = id;
        label.textContent = humanizeName(item.name);
        label.title = item.name;
        label.style.flex='1';
        // Toggle de capa al cambiar checkbox
  cb.addEventListener('change', () => toggleLayer(item, cb.checked));
        // Efecto hover: si la capa ya está cargada, resaltar geometrías
        label.addEventListener('mouseenter', () => {
          const url = item.url;
          // Si está marcada como activa (permanente), no hacemos el hover temporal
          const cbEl = groupsContainer.querySelector(`input[type=checkbox][data-url="${CSS.escape(url)}"]`);
          const rowEl = cbEl ? cbEl.closest('.file-item') : null;
          if (rowEl && rowEl.classList.contains('active')) return;
          highlightLayer(url, item);
        });
        label.addEventListener('mouseleave', () => {
          const url = item.url;
          const cbEl = groupsContainer.querySelector(`input[type=checkbox][data-url="${CSS.escape(url)}"]`);
          const rowEl = cbEl ? cbEl.closest('.file-item') : null;
          if (rowEl && rowEl.classList.contains('active')) return;
          restoreLayer(url, item);
        });

        row.appendChild(cb); row.appendChild(label); list.appendChild(row);
      });
      sec.appendChild(list);
      groupsContainer.appendChild(sec);
    });
  }

  // Escuchar cambios de zoom para ajustar labels
  map.on('zoomend', () => {
    try{ updateAllLabelsByZoom(); }catch(e){}
  });
  // Escuchar movimientos (pan) para recalcular espacio de etiquetas
  map.on('moveend', () => { try{ updateAllLabelsByZoom(); }catch(e){} });

  // Actualiza la visibilidad y el tamaño de los labels para todas las capas (llamado en zoomend)
  function updateAllLabelsByZoom(){
    const z = map.getZoom();
    // ajustar tamaño de fuente globalmente
    const t = Math.max(0, Math.min(1, (z - 5) / 10)); // normaliza entre zoom ~5-15
    const font = Math.round(LABEL_MIN_FONT + (LABEL_MAX_FONT - LABEL_MIN_FONT) * t);
    // aplicar al CSS de tooltips
    try{
      document.querySelectorAll('.geodatos-point-label').forEach(el => {
        el.style.fontSize = font + 'px';
      });
    }catch(e){}

    // actualizar por capa: si la capa tiene muchos puntos, solo mostrar labels si zoom >= umbral
    layers.forEach((layer, url) => {
      try{
        const item = findItemByUrl(url);
        if (!item) return;
        const n = item._pointCount || 0;
        const shouldShow = (n <= LABEL_PERMANENT_THRESHOLD) || (z >= LABEL_ZOOM_THRESHOLD);
        setLayerLabelsVisibility(layer, item, shouldShow, shouldShow);
      }catch(e){}
    });
  }

  // Buscar el objeto item en index por url
  function findItemByUrl(url){
    return index.find(i => i.url === url) || null;
  }

  // Controla binding/unbinding de tooltips para una capa (layer puede ser group layer)
  function setLayerLabelsVisibility(layer, item, visible, permanent){
    if (!layer) return;
    // Iterar sublayers y aplicar filtrado por colisión en píxeles para evitar solapamiento
    const z = map.getZoom();
    // Espacio mínimo en px entre etiquetas (escala ligeramente con zoom)
    const spacing = Math.max(8, Math.round(30 * (12 / Math.max(8, z))));
    if (typeof layer.eachLayer === 'function'){
      // Unbind previo y preparar lista de posiciones aceptadas
      const accepted = [];
      layer.eachLayer(child => { try{ child.unbindTooltip(); }catch(e){} });
      // Recorremos y aceptamos etiquetas si hay espacio suficiente
      layer.eachLayer(child => {
        try{
          const props = (child && child.feature && child.feature.properties) ? child.feature.properties : {};
          // Priorizar campo 'etiqueta' si existe; si no, usar heurística general
          let name = (props && (props['etiqueta'] || props['Etiqueta'] || props['ETIQUETA'])) || '';
          if (!name) name = extractName(props) || (child && child._labelName) || '';
          if (!name) return;
          // calcular punto en pixeles de pantalla
          let latlng = null;
          try{ if (child.getLatLng) latlng = child.getLatLng(); }catch(e){}
          if (!latlng && child.feature && child.feature.geometry && child.feature.geometry.type === 'MultiPoint'){
            // intentar usar la primera coordenada
            const coords = child.feature.geometry.coordinates && child.feature.geometry.coordinates[0];
            if (coords) latlng = L.latLng(coords[1], coords[0]);
          }
          if (!latlng) return;
          const p = map.latLngToContainerPoint(latlng);
          // comprobar distancia mínima a etiquetas ya aceptadas
          let ok = true;
          for (const q of accepted){
            const dx = p.x - q.x; const dy = p.y - q.y; const d2 = dx*dx + dy*dy;
            if (d2 < spacing*spacing){ ok = false; break; }
          }
          if (ok){
            child.bindTooltip(String(name), { permanent: !!permanent, direction: 'right', offset:[12,0], className:'geodatos-point-label' });
            try{ if (permanent) child.openTooltip(); }catch(e){}
            accepted.push(p);
          }
        }catch(e){}
      });
    } else {
      // single layer: bind si visible y hay nombre
      try{
        try{ layer.unbindTooltip(); }catch(e){}
        const props = (layer && layer.feature && layer.feature.properties) ? layer.feature.properties : {};
        let name = (props && (props['etiqueta'] || props['Etiqueta'] || props['ETIQUETA'])) || '';
        if (!name) name = extractName(props) || (layer && layer._labelName) || '';
        if (!name) return;
        if (visible){
          // para single layer asumimos que espacio es suficiente
          layer.bindTooltip(String(name), { permanent: !!permanent, direction:'right', offset:[12,0], className:'geodatos-point-label' });
          if (permanent) try{ layer.openTooltip(); }catch(e){}
        }
      }catch(e){}
    }
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
        // Calcular cantidad de puntos para ajustar dinamicamente el tamaño de los círculos
        let pointCount = 0;
        try{
          const feats = Array.isArray(geo.features) ? geo.features : [];
          for (const f of feats){
            const t = f?.geometry?.type || '';
            if (!t) continue;
            if (t === 'Point') pointCount += 1;
            else if (t === 'MultiPoint'){
              const coords = f.geometry.coordinates || [];
              pointCount += Array.isArray(coords) ? coords.length : 0;
            }
          }
        }catch(e){ pointCount = 0; }
        const layer = L.geoJSON(geo, {
          style: feature => styleForFeature(feature, item),
          pointToLayer: (feature, latlng) => pointStyle(feature, latlng, pointCount),
          onEachFeature: (feature, lyr) => onEachFeature(item, feature, lyr),
          renderer
        }).addTo(map);
        layers.set(url, layer);
        // Guardar el conteo para reglas de etiquetas
        try{ item._pointCount = pointCount; }catch(e){}
        // Marcar visualmente el elemento del sidebar como activo (persistente)
        try{
          const cb = groupsContainer.querySelector(`input[type=checkbox][data-url="${CSS.escape(url)}"]`);
          const row = cb ? cb.closest('.file-item') : null;
          if (row) row.classList.add('active');
          // Aplicar estilo resaltado permanente
          highlightLayer(url, item);
        }catch(e){}
        try { map.fitBounds(layer.getBounds(), { padding:[20,20] }); } catch(e){}
        // Ajustar visibilidad de labels inmediatamente según umbrales y zoom actual
        try{ updateAllLabelsByZoom(); }catch(e){}
      }).catch(e => {
        console.error('No se pudo cargar', url, e);
        alert('No se pudo cargar el archivo: ' + item.name);
        // apaga el checkbox si falló
        const cb = groupsContainer.querySelector(`input[type=checkbox][data-url="${CSS.escape(url)}"]`);
        if (cb) cb.checked = false;
      });
    } else {
      const layer = layers.get(url);
      try{
        const cb = groupsContainer.querySelector(`input[type=checkbox][data-url="${CSS.escape(url)}"]`);
        const row = cb ? cb.closest('.file-item') : null;
        if (row) row.classList.remove('active');
      }catch(e){}
      if(layer){
        // Restaurar estilos por si estaba resaltada
        try{ restoreLayer(url, item); }catch(e){}
        map.removeLayer(layer);
        layers.delete(url);
        // luego de quitar, actualizar labels (por si algo cambió)
        try{ updateAllLabelsByZoom(); }catch(e){}
      }
    }
  }

  function styleForFeature(feature, item){
    const t = feature?.geometry?.type || '';
    // Polígonos (áreas): bordes opacos en azul, relleno turquesa transparente
    if (t.includes('Polygon') || t.includes('MultiPolygon')){
      return {
        color: 'rgb(55,95,122)', // borde azul opaco
        weight: 1.6,
        fillColor: 'rgb(38,186,165)', // relleno turquesa
        fillOpacity: 0.015,
        opacity: 1
      };
    }
    // Líneas: usar azul opaco por defecto; si es hidro, usar turquesa
    if (t.includes('LineString') || t.includes('MultiLineString')){
      const isHidro = (item?.group||'').toLowerCase().includes('hidro');
      if (isHidro){
        return { color: 'rgb(38,186,165)', weight: 2.2, opacity: 1 };
      }
      return { color: 'rgb(55,95,122)', weight: 1.8, opacity: 1 };
    }
    // Puntos / otros: usar esquema de colores turquesa con borde azul
    return { color: 'rgb(55,95,122)', weight: 2, fillColor: 'rgb(38,186,165)', fillOpacity: 0.6 };
  }

  // pointStyle adapta el radio según la cantidad total de puntos en la capa
  function pointStyle(feature, latlng, totalPoints){
    // Determinar radio según reglas escaladas (puedes ajustar los umbrales)
    let r = 10; // radio por defecto para pocas entidades
    try{
      const n = Math.max(0, Number(totalPoints) || 0);
      if (n === 0) r = 8;
      else if (n > 5000) r = 2;
      else if (n > 2000) r = 3;
      else if (n > 1000) r = 3.5;
      else if (n > 500) r = 4;
      else if (n > 200) r = 5;
      else if (n > 100) r = 6;
      else if (n > 50) r = 7;
      else if (n > 20) r = 9;
      else r = 12; // pocos elementos -> más grande
    }catch(e){ r = 6; }
    const marker = L.circleMarker(latlng, { radius: r, color:'#375f7a', weight: Math.max(2, Math.round(r/2)), fillColor:'#26baa5', fillOpacity: 0.6 });
    // Guardar radio original para poder restaurarlo tras hover
    try{ marker.options._origRadius = r; }catch(e){}
    return marker;
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
      // Guardar el nombre en la capa para que la lógica de labels lo gestione según umbrales/zoom
      try{ layer._labelName = name; }catch(e){}
      const html = buildPopupBody(props);
      if (html) layer.on('click', () => openModal(html, name));
      return;
    }
    if (t === 'MultiPoint'){
      if (!name) return;
      if (layer && typeof layer.eachLayer === 'function'){
        layer.eachLayer(child => {
          try{
            child._labelName = name;
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
      'etiqueta','Etiqueta','ETIQUETA',
      'centro_salud','centro','nombre_estab','nombre_establecimiento','nombre_e',
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
