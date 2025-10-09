import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { jsPDF } from 'jspdf';
import leafletImage from 'leaflet-image';
import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';

// Asegurar que estamos en la vista correcta
if(!document.getElementById('map')) {
  // No ejecutar fuera de la vista mapa político
} else {
  // Estado dinámico
  const state = {
    opacity: 0.8,
    strokeWidth: 1.2,
    active: { level: 'adm1', id: null },
    styles: { adm1: {}, adm3: {} }, // level -> id -> {fill, stroke, text}
    halo: { enabled: true, color: '#ffffff', width: 3 },
  };

  // Paleta base (reutilizable)
  const baseColors = ['#ef9a9a','#ffcc80','#fff59d','#a5d6a7','#80cbc4','#90caf9','#b39ddb','#ce93d8','#bcaaa4'];
  let colorIndex = 0;

  const fillInput = document.getElementById('colorFill');
  const strokeInput = document.getElementById('colorStroke');
  const textInput = document.getElementById('colorText');
  const opacityRange = document.getElementById('opacityRange');
  const strokeWidthRange = document.getElementById('strokeWidthRange');
  const worldOpacityRange = document.getElementById('worldOpacityRange');
  const toggleTextHalo = document.getElementById('toggleTextHalo');
  const textHaloColor = document.getElementById('textHaloColor');
  const textHaloWidth = document.getElementById('textHaloWidth');
  const legendContent = document.getElementById('legendContent');
  const toggleAdm1 = document.getElementById('toggleAdm1');
  const toggleAdm3 = document.getElementById('toggleAdm3');

  // Usar renderer SVG (no Canvas) para mejor compatibilidad con exportación
  const map = L.map('map').setView([-16.5,-64.9], 5);

  // Capa base (mundo). Ajustaremos su opacidad con el slider de "Atenuación mundo"
  const baseTiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(map);
  // Opacidad inicial según el control (interpretado como atenuación: 0=sin atenuar -> opacidad 1)
  if (worldOpacityRange) {
    const att = parseFloat(worldOpacityRange.value || '0');
    baseTiles.setOpacity(Math.max(0, Math.min(1, 1 - att)));
  }

  let layerAdm1 = null; // Departamentos
  let layerAdm3 = null; // Provincias
  const labelGroupAdm1 = L.layerGroup();
  const labelGroupAdm3 = L.layerGroup();

  const canvasRenderer = L.canvas({ padding: 0.5 });

  Promise.all([
    fetch('/geo/geoBoundaries-BOL-ADM1.geojson').then(r=>r.ok?r.json():Promise.reject('ADM1 no encontrado')),
    // ADM3: usar tu archivo; probar dos nombres
    loadFirstAvailable(['/geo/bolivia_adm3.geojson','/geo/bolivia_amd3.geojson'])
  ]).then(([adm1, adm3]) => {
    prepareLevel('adm1', adm1.features);
    prepareLevel('adm3', adm3.features);

    layerAdm1 = L.geoJSON(adm1, {
      style: feat => styleFor('adm1', normalizeProps(feat.properties).__id),
      onEachFeature: (feature, layer) => attachHandlers(layer, 'adm1'),
      renderer: canvasRenderer
    }).addTo(map);

    layerAdm3 = L.geoJSON(adm3, {
      style: feat => styleFor('adm3', normalizeProps(feat.properties).__id),
      onEachFeature: (feature, layer) => attachHandlers(layer, 'adm3'),
      renderer: canvasRenderer
    }); // no añadir aún; se añade con el toggle
    map.fitBounds(layerAdm1.getBounds(), { padding:[20,20] });

    // Añadir etiquetas iniciales de ADM1
    labelGroupAdm1.addTo(map);
    addStaticLabels();
    buildButtons('adm1', adm1.features);
    buildButtons('adm3', adm3.features);
    buildLegend();
    state.active = { level:'adm1', id: normalizeProps(adm1.features[0].properties).__id };
    syncUI();
  }).catch(err => console.error(err));

  // Eliminado rectángulo de tinte global; controlamos la "suavidad" del mundo con la opacidad de la capa base.

  function loadFirstAvailable(urls){
    return new Promise((resolve, reject) => {
      const tryNext = (i) => {
        if(i >= urls.length) return reject(new Error('Sin archivos disponibles'));
        fetch(urls[i])
          .then(res => { if(!res.ok) throw new Error(res.status); return res.json(); })
          .then(json => { console.info('Usando GeoJSON:', urls[i]); resolve(json); })
          .catch(()=> tryNext(i+1));
      };
      tryNext(0);
    });
  }

  // Handlers por feature
  function attachHandlers(layer, level){
    layer.on('click', () => {
      const p = normalizeProps(layer.feature.properties);
      state.active = { level, id: p.__id };
      syncUI();
    });
    const p = normalizeProps(layer.feature.properties);
    layer.bindTooltip(p.__name, {sticky:true, direction:'center', className:'deptTooltip'});
  }

  // Normalizar props y extraer id/nombre
  function normalizeProps(props){
    // Posibles campos estándar en distintas fuentes
    const nameCandidates = ['name','NAME_1','NAME','ADM1_ES','adm1_es','Nombre','NOMBRE','shapeName'];
    const idCandidates = ['id','ID_1','HASC_1','ISO_1','GID_1','cartodb_id','shapeID'];
    const name = nameCandidates.map(k=>props[k]).find(v=> !!v) || 'SinNombre';
    let id = idCandidates.map(k=>props[k]).find(v=> !!v);
    if(!id) id = (name || 'feature').toLowerCase().replace(/[^a-z0-9]+/g,'_');
    props.__id = id; props.__name = name; return props;
  }

  function prepareLevel(level, features){
    features.forEach(f => {
      const p = normalizeProps(f.properties);
      if(!state.styles[level][p.__id]){
        state.styles[level][p.__id] = {
          fill: baseColors[colorIndex++ % baseColors.length],
          stroke: '#222222',
          text: '#000000'
        };
      }
    });
  }

  function styleFor(level, id){
    const s = state.styles[level][id];
    return {
      color: s.stroke,
      weight: state.strokeWidth,
      fillColor: s.fill,
      fillOpacity: state.opacity
    };
  }

  function refreshStyles(){
    if(layerAdm1) layerAdm1.setStyle(f => styleFor('adm1', normalizeProps(f.properties).__id));
    if(layerAdm3) layerAdm3.setStyle(f => styleFor('adm3', normalizeProps(f.properties).__id));
    // actualiza colores de las etiquetas
    document.querySelectorAll('.dept-label-span').forEach(span => {
      const id = span.dataset.id;
      const level = span.dataset.level;
      span.style.color = state.styles[level][id].text;
    });
    applyHaloToLabels();
  }

  function applyHaloToLabels(){
    const enabled = !!state.halo.enabled;
    const color = state.halo.color || '#ffffff';
    const w = Math.max(0, parseInt(state.halo.width || 0, 10));
    const shadow = enabled && w > 0 ? `0 0 ${w}px ${color}, 0 0 ${Math.max(0,w-1)}px ${color}` : 'none';
    document.querySelectorAll('.dept-label-span').forEach(span => {
      span.style.textShadow = shadow;
    });
  }

  function buildButtons(level, features){
    const container = document.getElementById(level==='adm1' ? 'adm1Btns' : 'adm3Btns');
    container.innerHTML = '';
    features.forEach(f => {
      const b = document.createElement('button');
      b.className = 'dept-btn';
      b.dataset.id = f.properties.__id;
      b.dataset.level = level;
      b.textContent = f.properties.__name;
      b.onclick = () => { state.active = { level, id: f.properties.__id }; syncUI(); };
      container.appendChild(b);
    });
  }

  function syncUI(){
    document.querySelectorAll('.dept-btn').forEach(b => b.classList.toggle('active', (b.dataset.id === state.active.id && b.dataset.level === state.active.level)));
    if(state.active && state.styles[state.active.level][state.active.id]){
      const s = state.styles[state.active.level][state.active.id];
      fillInput.value = s.fill;
      strokeInput.value = s.stroke;
      textInput.value = s.text;
    }
    // toggles de capas
    const showAdm1 = toggleAdm1.checked;
    const showAdm3 = toggleAdm3.checked;
    if(layerAdm1){
      if(showAdm1 && !map.hasLayer(layerAdm1)) map.addLayer(layerAdm1);
      if(!showAdm1 && map.hasLayer(layerAdm1)) map.removeLayer(layerAdm1);
      if(showAdm1 && !map.hasLayer(labelGroupAdm1)) map.addLayer(labelGroupAdm1);
      if(!showAdm1 && map.hasLayer(labelGroupAdm1)) map.removeLayer(labelGroupAdm1);
    }
    if(layerAdm3){
      if(showAdm3 && !map.hasLayer(layerAdm3)) map.addLayer(layerAdm3);
      if(!showAdm3 && map.hasLayer(layerAdm3)) map.removeLayer(layerAdm3);
      if(showAdm3 && !map.hasLayer(labelGroupAdm3)) { addLabelsFor(layerAdm3, 'adm3', labelGroupAdm3); map.addLayer(labelGroupAdm3); }
      if(!showAdm3 && map.hasLayer(labelGroupAdm3)) map.removeLayer(labelGroupAdm3);
    }
    refreshStyles();
  }

  // Labels fijos (divIcons) centrados
  function addLabelsFor(layer, level, group){
    if(!layer) return;
    group.clearLayers();
    layer.eachLayer(l => {
      const center = l.getBounds().getCenter();
      const p = normalizeProps(l.feature.properties);
      // Usar posición guardada si existe
      const saved = state.styles[level][p.__id] && state.styles[level][p.__id].labelLatLng;
      const pos = saved ? L.latLng(saved[0], saved[1]) : center;
      const ic = L.divIcon({
        className: 'dept-label',
        html: `<span class="label-span dept-label-span" data-level="${level}" data-id="${p.__id}">${p.__name}</span>`
      });
      const mk = L.marker(pos, { icon: ic, interactive: true, draggable: true }).addTo(group);
      mk.on('dragend', () => {
        const ll = mk.getLatLng();
        if (!state.styles[level][p.__id]) state.styles[level][p.__id] = {};
        state.styles[level][p.__id].labelLatLng = [ll.lat, ll.lng];
      });
    });
  }

  function addStaticLabels(){
    addLabelsFor(layerAdm1, 'adm1', labelGroupAdm1);
    // ADM3 se añade cuando se active el toggle
    applyHaloToLabels();
  }

  function buildLegend(){
    legendContent.innerHTML='';
    const pushFromLayer = (layer, level) => {
      if(!layer) return;
      layer.eachLayer(l => {
        const p = normalizeProps(l.feature.properties);
        const st = state.styles[level][p.__id];
        const div = document.createElement('div');
        div.innerHTML = `<span class="color-box" style="background:${st.fill}"></span>${p.__name} <span class="small">(${level.toUpperCase()})</span>`;
        legendContent.appendChild(div);
      });
    };
    pushFromLayer(layerAdm1, 'adm1');
    pushFromLayer(layerAdm3, 'adm3');
  }

  fillInput.addEventListener('input', () => { if(!state.active.id) return; state.styles[state.active.level][state.active.id].fill = fillInput.value; refreshStyles(); buildLegend(); });
  strokeInput.addEventListener('input', () => { if(!state.active.id) return; state.styles[state.active.level][state.active.id].stroke = strokeInput.value; refreshStyles(); });
  textInput.addEventListener('input', () => { if(!state.active.id) return; state.styles[state.active.level][state.active.id].text = textInput.value; refreshStyles(); });
  opacityRange.addEventListener('input', () => { state.opacity = parseFloat(opacityRange.value); refreshStyles(); });
  strokeWidthRange.addEventListener('input', () => { state.strokeWidth = parseFloat(strokeWidthRange.value); refreshStyles(); });
  if (worldOpacityRange) {
    worldOpacityRange.addEventListener('input', () => {
      const att = parseFloat(worldOpacityRange.value);
      baseTiles.setOpacity(Math.max(0, Math.min(1, 1 - att)));
    });
  }
  if (toggleTextHalo) {
    toggleTextHalo.addEventListener('change', () => { state.halo.enabled = !!toggleTextHalo.checked; applyHaloToLabels(); });
  }
  if (textHaloColor) {
    textHaloColor.addEventListener('input', () => { state.halo.color = textHaloColor.value; applyHaloToLabels(); });
  }
  if (textHaloWidth) {
    textHaloWidth.addEventListener('input', () => { state.halo.width = parseInt(textHaloWidth.value,10) || 0; applyHaloToLabels(); });
  }
  toggleAdm1.addEventListener('change', syncUI);
  toggleAdm3.addEventListener('change', syncUI);

  document.getElementById('btnReset').addEventListener('click', () => {
    map.setView([-16.5,-64.9],5);
  });

  document.getElementById('btnExportPNG').addEventListener('click', () => {
    renderExportCanvas((err, canvas) => {
      if(err){ console.error(err); alert('No se pudo exportar la imagen.'); return; }
      try {
        const scaled = scaleCanvasIfNeeded(canvas, 5000);
        scaled.toBlob(blob => {
          if(!blob){
            // Fallback a dataURL
            const a = document.createElement('a');
            a.href = scaled.toDataURL('image/png');
            a.download = 'mapa-politico-bolivia.png';
            document.body.appendChild(a);
            a.click();
            a.remove();
            return;
          }
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'mapa-politico-bolivia.png';
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        }, 'image/png');
      } catch(e){
        console.error(e);
        alert('No se pudo generar PNG (posible restricción del navegador).');
      }
    });
  });

  document.getElementById('btnExportPDF').addEventListener('click', () => {
    renderExportCanvas((err, canvas) => {
      if(err){ console.error(err); alert('No se pudo exportar a PDF.'); return; }
      try {
        const scaled = scaleCanvasIfNeeded(canvas, 4000);
        const orientation = scaled.width >= scaled.height ? 'landscape' : 'portrait';
        const pdf = new jsPDF({orientation, unit:'px', format:[scaled.width, scaled.height]});
        pdf.addImage(scaled.toDataURL('image/png'), 'PNG', 0, 0, scaled.width, scaled.height);
        pdf.save('mapa-politico-bolivia.pdf');
      } catch(e){
        console.error(e);
        alert('No se pudo generar PDF (posible restricción del navegador).');
      }
    });
  });

  // --- Export helpers ---
  function renderExportCanvas(cb){
    const hadTiles = map.hasLayer(baseTiles);
    const hadAdm1Labels = map.hasLayer(labelGroupAdm1);
    const hadAdm3Labels = map.hasLayer(labelGroupAdm3);
    if(hadTiles) map.removeLayer(baseTiles); // Evitar CORS y garantizar exportación
    // Remover temporalmente etiquetas (markers con divIcon) que rompen leaflet-image
    if(hadAdm1Labels) map.removeLayer(labelGroupAdm1);
    if(hadAdm3Labels) map.removeLayer(labelGroupAdm3);
    // Asegurar que las capas vectoriales visibles estén añadidas
    const hadAdm1 = layerAdm1 && map.hasLayer(layerAdm1);
    const hadAdm3 = layerAdm3 && map.hasLayer(layerAdm3);
    const tempGroup = L.layerGroup();
    if (toggleAdm1.checked && layerAdm1 && !hadAdm1) tempGroup.addLayer(layerAdm1);
    if (toggleAdm3.checked && layerAdm3 && !hadAdm3) tempGroup.addLayer(layerAdm3);
    if (tempGroup.getLayers().length) tempGroup.addTo(map);
    // Esperar a que el mapa esté en reposo y re-renderizado sin tiles
    const doCapture = () => {
      requestAnimationFrame(() => {
        leafletImage(map, (err, canvas) => {
          // Restaurar tiles y capas temporales/etiquetas
          if(hadTiles) map.addLayer(baseTiles);
          if (tempGroup) map.removeLayer(tempGroup);
          // Restaurar etiquetas antes de decidir fallback
          if(hadAdm1Labels) map.addLayer(labelGroupAdm1);
          if(hadAdm3Labels) map.addLayer(labelGroupAdm3);
          // Si hay error o canvas inválido/dimensionado a 0, intentar fallback con html-to-image
          if(err || !canvas || !canvas.getContext || canvas.width === 0 || canvas.height === 0){
            console.warn('leaflet-image falló, usando fallback html-to-image', err);
            fallbackHtmlToImage(cb);
            return;
          }
          try {
            // Componer fondo blanco + mapa
            const merged = document.createElement('canvas');
            merged.width = canvas.width; merged.height = canvas.height;
            const mctx = merged.getContext('2d');
            mctx.fillStyle = '#ffffff';
            mctx.fillRect(0,0,merged.width, merged.height);
            mctx.drawImage(canvas, 0, 0);
            drawLabelsOnCanvas(mctx);
            cb && cb(null, merged);
          } catch(e){
            console.warn('No se pudieron dibujar etiquetas en el canvas, usando fallback:', e);
            fallbackHtmlToImage(cb);
          }
        });
      });
    };
    // usar un pequeño timeout por si no se dispara idle inmediatamente
    let idleHandled = false;
    const onIdle = () => { if(idleHandled) return; idleHandled = true; map.off('idle', onIdle); doCapture(); };
    map.on('idle', onIdle);
    setTimeout(onIdle, 80);
  }

  function fallbackHtmlToImage(cb){
    const node = document.getElementById('map');
    const hadTiles = map.hasLayer(baseTiles);
    const hadAdm1Labels = map.hasLayer(labelGroupAdm1);
    const hadAdm3Labels = map.hasLayer(labelGroupAdm3);
    if(hadTiles) map.removeLayer(baseTiles); // también ocultar tiles para evitar CORS en DOM capture
    if(hadAdm1Labels) map.removeLayer(labelGroupAdm1);
    if(hadAdm3Labels) map.removeLayer(labelGroupAdm3);
    // Escala para mejor calidad
    const scale = Math.min(2, window.devicePixelRatio || 2);
    const doDomCapture = () => toPng(node, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: scale
      });
    // pequeño retraso para permitir reflow sin tiles
    setTimeout(() => doDomCapture().then(dataUrl => {
  if(hadTiles) map.addLayer(baseTiles);
  if(hadAdm1Labels) map.addLayer(labelGroupAdm1);
  if(hadAdm3Labels) map.addLayer(labelGroupAdm3);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0,0,canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        cb && cb(null, canvas);
      };
      img.src = dataUrl;
    }).catch(e => {
      console.warn('html-to-image falló, intentando html2canvas...', e);
      html2canvas(node, { backgroundColor: '#ffffff', scale, useCORS: true, logging: false }).then(canvas => {
        if(hadTiles) map.addLayer(baseTiles);
        if(hadAdm1Labels) map.addLayer(labelGroupAdm1);
        if(hadAdm3Labels) map.addLayer(labelGroupAdm3);
        cb && cb(null, canvas);
      }).catch(err2 => {
        if(hadTiles) map.addLayer(baseTiles);
        if(hadAdm1Labels) map.addLayer(labelGroupAdm1);
        if(hadAdm3Labels) map.addLayer(labelGroupAdm3);
        console.error('html2canvas también falló', err2);
        cb && cb(err2);
      });
    }), 50);
  }

  function scaleCanvasIfNeeded(canvas, maxSide){
    const w = canvas.width, h = canvas.height;
    const max = Math.max(w,h);
    if(max <= maxSide) return canvas;
    const k = maxSide / max;
    const nw = Math.round(w*k), nh = Math.round(h*k);
    const off = document.createElement('canvas');
    off.width = nw; off.height = nh;
    const ctx = off.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(canvas, 0, 0, nw, nh);
    return off;
  }

  function drawLabelsOnCanvas(ctx){
    if(!ctx) return;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const haloEnabled = !!state.halo.enabled;
    const haloColor = state.halo.color || '#ffffff';
    const haloWidth = Math.max(0, parseInt(state.halo.width || 0, 10));
    const drawForLayer = (layer, level) => {
      if(!layer) return;
      const show = (level==='adm1') ? toggleAdm1.checked : toggleAdm3.checked;
      if(!show) return;
      layer.eachLayer(l => {
        const p = normalizeProps(l.feature.properties);
        const s = state.styles[level][p.__id] || { text: '#000000' };
        // Usar la posición guardada si existe, si no el centro del feature
        const saved = s.labelLatLng;
        const ll = saved ? L.latLng(saved[0], saved[1]) : l.getBounds().getCenter();
        const pt = map.latLngToContainerPoint(ll);
        const text = p.__name;
        const fontSize = 12; // puedes ajustar o hacerlo dependiente del zoom
        ctx.font = `bold ${fontSize}px sans-serif`;
        // halo para legibilidad (configurable)
        if (haloEnabled && haloWidth > 0) {
          ctx.strokeStyle = haloColor;
          ctx.lineWidth = haloWidth;
          ctx.strokeText(text, pt.x, pt.y);
        }
        // texto coloreado
        ctx.fillStyle = s.text || '#000';
        ctx.fillText(text, pt.x, pt.y);
      });
    };
    drawForLayer(layerAdm1, 'adm1');
    drawForLayer(layerAdm3, 'adm3');
    ctx.restore();
  }
}
