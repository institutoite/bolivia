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
  mode: 'menu', // 'menu' | 'bolivia' | 'departamento' | 'provincia'
    selectedDeptId: null,
    selectedProvId: null,
    attenuationRestBolivia: 0.6,
    attenuationDepartment: 0.5,
    strokeOverrideColor: null
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
  const restBoliviaRange = document.getElementById('restBoliviaRange');
  const deptAttenuationRange = document.getElementById('deptAttenuationRange');
  const toggleTextHalo = document.getElementById('toggleTextHalo');
  const textHaloColor = document.getElementById('textHaloColor');
  const textHaloWidth = document.getElementById('textHaloWidth');
  const legendContent = document.getElementById('legendContent');
  const toggleAdm1 = document.getElementById('toggleAdm1');
  const toggleAdm3 = document.getElementById('toggleAdm3');
  const btnModeBolivia = document.getElementById('btnModeBolivia');
  const btnModeDepartamento = document.getElementById('btnModeDepartamento');
  const btnModeProvincia = document.getElementById('btnModeProvincia');
  const btnBack = document.getElementById('btnBack');
  const modeNav = document.getElementById('modeNav');
  const sectionDeptList = document.getElementById('sectionDeptList');
  const sectionProvList = document.getElementById('sectionProvList');
  const stylesSection = document.getElementById('stylesSection');
  const sectionLayers = document.getElementById('sectionLayers');
  const exportSection = document.getElementById('exportBtns');
  const legendSection = document.getElementById('legend');

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
  let layerAdm3 = null; // Provincias (dinámica según modo)
  let capitalsAdm1Layer = null; // Capitales departamentales
  let municipiosLayer = null; // Municipios (si el dataset existe)
  let adm1Data = null;
  let adm3Data = null;
  const provinceParent = {}; // adm3Id -> adm1Id
  const labelGroupAdm1 = L.layerGroup();
  const labelGroupAdm3 = L.layerGroup();

  const canvasRenderer = L.canvas({ padding: 0.5 });

  Promise.all([
    fetch('/geo/geoBoundaries-BOL-ADM1.geojson').then(r=>r.ok?r.json():Promise.reject('ADM1 no encontrado')),
    // ADM3: usar tu archivo; probar dos nombres
    loadFirstAvailable(['/geo/bolivia_adm3.geojson','/geo/bolivia_amd3.geojson']),
    fetch('/geo/capitals_adm1.geojson').then(r=>r.ok?r.json():null).catch(()=>null)
  ]).then(([adm1, adm3, capitalsAdm1]) => {
    adm1Data = adm1;
    adm3Data = adm3;
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
    }); // no añadir aún; se añade con el toggle o por modo
    map.fitBounds(layerAdm1.getBounds(), { padding:[20,20] });

    // Añadir etiquetas iniciales de ADM1
    labelGroupAdm1.addTo(map);
    addStaticLabels();
    buildButtons('adm1', adm1.features);
    buildButtons('adm3', adm3.features);
    buildProvinceParentMap();
    // Capa de capitales departamentales (si existe)
    if (capitalsAdm1 && capitalsAdm1.features) {
      capitalsAdm1Layer = L.geoJSON(capitalsAdm1, {
        pointToLayer: (feature, latlng) => L.circleMarker(latlng, { radius: 5, color: '#d32f2f', weight: 2, fillColor:'#ffcdd2', fillOpacity: 0.9 }),
        onEachFeature: (feature, layer) => {
          const name = feature.properties && (feature.properties.name || feature.properties.Nombre || 'Capital');
          layer.bindTooltip(name, { permanent:false, direction:'top' });
        }
      });
    }
    buildLegend();
    state.active = { level:'adm1', id: normalizeProps(adm1.features[0].properties).__id };
    syncUI();
    renderMode();
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
    const base = {
      color: s.stroke,
      weight: state.strokeWidth,
      fillColor: s.fill,
      fillOpacity: state.opacity
    };
    // Atenuación del resto de Bolivia (cuando hay un departamento seleccionado)
    if (level === 'adm1' && (state.mode === 'departamento' || state.mode === 'provincia') && state.selectedDeptId){
      if (id !== state.selectedDeptId){
        const att = Math.max(0, Math.min(1, state.attenuationRestBolivia));
        base.fillOpacity = Math.max(0.02, base.fillOpacity * (1 - att));
        base.weight = Math.max(0.5, state.strokeWidth * 0.6);
        base.color = '#999999';
      }
    }
    // Atenuación de otras provincias del departamento cuando hay una provincia seleccionada
    if (level === 'adm3' && state.mode === 'provincia' && state.selectedProvId){
      const parent = provinceParent[id];
      if (parent && parent === state.selectedDeptId && id !== state.selectedProvId){
        const att = Math.max(0, Math.min(1, state.attenuationDepartment));
        base.fillOpacity = Math.max(0.02, base.fillOpacity * (1 - att));
      }
    }
    // Unificar color y grosor de borde del elemento seleccionado y sus divisiones
    if (qualifiesStrokeOverride(level, id)){
      if (state.strokeOverrideColor) base.color = state.strokeOverrideColor;
      base.weight = state.strokeWidth;
    }
    return base;
  }

  function qualifiesStrokeOverride(level, id){
    if (state.mode === 'bolivia'){
      return (level === 'adm1' || level === 'adm3');
    }
    if (state.mode === 'departamento' && state.selectedDeptId){
      if (level === 'adm1') return id === state.selectedDeptId;
      if (level === 'adm3') return provinceParent[id] === state.selectedDeptId;
    }
    if (state.mode === 'provincia' && state.selectedProvId){
      if (level === 'adm3') return id === state.selectedProvId;
    }
    return false;
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
      b.onclick = () => {
        state.active = { level, id: f.properties.__id };
        if (state.mode === 'departamento' && level === 'adm1') {
          state.selectedDeptId = f.properties.__id;
          state.selectedProvId = null;
          renderMode();
        } else if (state.mode === 'provincia') {
          if (!state.selectedDeptId && level === 'adm1') {
            state.selectedDeptId = f.properties.__id;
            state.selectedProvId = null;
            renderMode();
          } else if (state.selectedDeptId && level === 'adm3') {
            // Solo permitir provincias que pertenezcan al dept seleccionado
            if (provinceParent[f.properties.__id] === state.selectedDeptId) {
              state.selectedProvId = f.properties.__id;
              renderMode();
            }
          }
        } else {
          syncUI();
        }
      };
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

  // --- Modo y navegación ---
  function setMode(mode){
    state.mode = mode;
    state.selectedDeptId = null;
    state.selectedProvId = null;
    renderMode();
  }

  function renderMode(){
    // Actualizar UI de navegación
    if (modeNav) {
      let trail = 'Modo: ' + state.mode.toUpperCase();
      if (state.selectedDeptId) trail += ' > Depto: ' + getNameById('adm1', state.selectedDeptId);
      if (state.selectedProvId) trail += ' > Prov: ' + getNameById('adm3', state.selectedProvId);
      modeNav.textContent = trail;
    }
    if (state.mode === 'menu'){
      if (sectionDeptList) sectionDeptList.style.display = 'none';
      if (sectionProvList) sectionProvList.style.display = 'none';
      if (sectionLayers) sectionLayers.style.display = 'none';
      if (exportSection) exportSection.style.display = 'none';
      if (legendSection) legendSection.style.display = 'none';
    } else {
      if (sectionDeptList) sectionDeptList.style.display = (state.mode === 'bolivia' ? 'none' : 'block');
      if (sectionProvList) sectionProvList.style.display = ((state.mode === 'departamento' && state.selectedDeptId) || state.mode==='provincia') ? 'block' : 'none';
      if (sectionLayers) sectionLayers.style.display = '';
      if (exportSection) exportSection.style.display = '';
      if (legendSection) legendSection.style.display = '';
    }
    if (btnBack) {
      const needBack = (state.mode !== 'bolivia') && (state.selectedDeptId || state.mode==='departamento' || state.mode==='provincia');
      btnBack.style.display = needBack ? '' : 'none';
    }
    // Visibilidad de controles (Estilos)
    if (stylesSection){
      let show = false;
      if (state.mode === 'bolivia') show = true;
      else if (state.mode === 'departamento') show = !!state.selectedDeptId;
      else if (state.mode === 'provincia') show = !!state.selectedDeptId;
      stylesSection.style.display = show ? 'block' : 'none';
    }
    // Filas específicas
    const rowRest = document.getElementById('rowRestBolivia');
    const rowDept = document.getElementById('rowDeptAtt');
    if (rowRest) rowRest.style.display = ((state.mode === 'departamento' && state.selectedDeptId) || (state.mode==='provincia' && state.selectedDeptId)) ? 'flex' : 'none';
    if (rowDept) rowDept.style.display = (state.mode==='provincia' && state.selectedProvId) ? 'flex' : 'none';

    // Mostrar/ocultar capas según modo
    // Reset elementos variables
    if (municipiosLayer && map.hasLayer(municipiosLayer)) { map.removeLayer(municipiosLayer); municipiosLayer = null; }
    if (labelGroupAdm3 && map.hasLayer(labelGroupAdm3)) map.removeLayer(labelGroupAdm3);
    if (layerAdm3 && map.hasLayer(layerAdm3)) map.removeLayer(layerAdm3);
    if (capitalsAdm1Layer && map.hasLayer(capitalsAdm1Layer)) map.removeLayer(capitalsAdm1Layer);

    if (state.mode === 'menu'){
      // Ocultar todo menos el mapa base
      if (map.hasLayer(layerAdm1)) map.removeLayer(layerAdm1);
      if (map.hasLayer(labelGroupAdm1)) map.removeLayer(labelGroupAdm1);
      return; // no continuar con más capas
    }

    // Siempre mostrar departamentos como base (si toggle activo)
    if (toggleAdm1.checked && !map.hasLayer(layerAdm1)) map.addLayer(layerAdm1);
    if (!toggleAdm1.checked && map.hasLayer(layerAdm1)) map.removeLayer(layerAdm1);
    if (toggleAdm1.checked && !map.hasLayer(labelGroupAdm1)) map.addLayer(labelGroupAdm1);
    if (!toggleAdm1.checked && map.hasLayer(labelGroupAdm1)) map.removeLayer(labelGroupAdm1);

    if (state.mode === 'bolivia'){
      // Provincias según toggle
      if (toggleAdm3.checked && layerAdm3) {
        layerAdm3 = rebuildAdm3Layer(adm3Data.features); // todas
        map.addLayer(layerAdm3);
        addLabelsFor(layerAdm3, 'adm3', labelGroupAdm3);
        map.addLayer(labelGroupAdm3);
      }
      if (capitalsAdm1Layer) map.addLayer(capitalsAdm1Layer);
      map.fitBounds(layerAdm1.getBounds(), { padding:[20,20] });
    } else if (state.mode === 'departamento'){
      if (!state.selectedDeptId){
        // Mostrar listado de departamentos; no acciones extra
        // Asegurar vista general
        map.fitBounds(layerAdm1.getBounds(), { padding:[20,20] });
      } else {
        // Enfocar al departamento y mostrar provincias del depto
        const deptLayer = findLayerById(layerAdm1, 'adm1', state.selectedDeptId);
        if (deptLayer) map.fitBounds(deptLayer.getBounds(), { padding:[30,30] });
        const provFeatures = adm3Data.features.filter(f => provinceParent[normalizeProps(f.properties).__id] === state.selectedDeptId);
        if (toggleAdm3.checked){
          layerAdm3 = rebuildAdm3Layer(provFeatures);
          map.addLayer(layerAdm3);
          addLabelsFor(layerAdm3, 'adm3', labelGroupAdm3);
          map.addLayer(labelGroupAdm3);
        }
      }
    } else if (state.mode === 'provincia'){
      if (!state.selectedDeptId){
        map.fitBounds(layerAdm1.getBounds(), { padding:[20,20] });
      } else if (!state.selectedProvId){
        const deptLayer = findLayerById(layerAdm1, 'adm1', state.selectedDeptId);
        if (deptLayer) map.fitBounds(deptLayer.getBounds(), { padding:[30,30] });
        const provFeatures = adm3Data.features.filter(f => provinceParent[normalizeProps(f.properties).__id] === state.selectedDeptId);
        // Mostrar provincias disponibles en UI (botonera ya filtrada más abajo)
        if (toggleAdm3.checked){
          layerAdm3 = rebuildAdm3Layer(provFeatures);
          map.addLayer(layerAdm3);
          addLabelsFor(layerAdm3, 'adm3', labelGroupAdm3);
          map.addLayer(labelGroupAdm3);
        }
      } else {
        const provFeature = adm3Data.features.find(f => normalizeProps(f.properties).__id === state.selectedProvId);
        if (provFeature){
          if (toggleAdm3.checked){
            layerAdm3 = rebuildAdm3Layer([provFeature]);
            map.addLayer(layerAdm3);
            addLabelsFor(layerAdm3, 'adm3', labelGroupAdm3);
            map.addLayer(labelGroupAdm3);
          }
          const lyr = findLayerById(layerAdm3, 'adm3', state.selectedProvId);
          if (lyr) map.fitBounds(lyr.getBounds(), { padding:[35,35] });
          // Intentar cargar municipios
          tryLoadMunicipios().catch(()=>{});
        }
      }
    }

    // Filtrar UI de provincias cuando proceda
    if (state.mode !== 'bolivia'){
      showDeptButtons();
      if (state.selectedDeptId) showProvButtonsForDept(state.selectedDeptId); else clearProvButtons();
    } else {
      // En modo Bolivia, mostrar listas originales completas
      buildButtons('adm1', adm1Data.features);
      buildButtons('adm3', adm3Data.features);
    }

    // Estilos refrescados
    refreshStyles();
  }

  function rebuildAdm3Layer(features){
    if (layerAdm3 && map.hasLayer(layerAdm3)) map.removeLayer(layerAdm3);
    const gj = { type:'FeatureCollection', features: features.map(f=>({ type:'Feature', properties:f.properties, geometry:f.geometry })) };
    return L.geoJSON(gj, {
      style: feat => styleFor('adm3', normalizeProps(feat.properties).__id),
      onEachFeature: (feature, layer) => attachHandlers(layer, 'adm3'),
      renderer: canvasRenderer
    });
  }

  function showDeptButtons(){
    if (!adm1Data) return;
    buildButtons('adm1', adm1Data.features);
  }

  function showProvButtonsForDept(deptId){
    if (!adm3Data) return;
    const provs = adm3Data.features.filter(f => provinceParent[normalizeProps(f.properties).__id] === deptId);
    const container = document.getElementById('adm3Btns');
    container.innerHTML = '';
    provs.forEach(f => {
      const b = document.createElement('button');
      b.className = 'dept-btn';
      b.dataset.id = f.properties.__id; b.dataset.level = 'adm3';
      b.textContent = f.properties.__name;
      b.onclick = () => { state.selectedProvId = f.properties.__id; renderMode(); };
      container.appendChild(b);
    });
  }

  function clearProvButtons(){
    const container = document.getElementById('adm3Btns');
    if (container) container.innerHTML = '';
  }

  function getNameById(level, id){
    const feats = level==='adm1' ? adm1Data?.features : adm3Data?.features;
    if(!feats) return id || '';
    const f = feats.find(ff => normalizeProps(ff.properties).__id === id);
    return f ? normalizeProps(f.properties).__name : (id||'');
  }

  // Construir mapa provincia->departamento por contención de centroide
  function buildProvinceParentMap(){
    if (!layerAdm1 || !layerAdm3) return;
    const depts = [];
    layerAdm1.eachLayer(l => {
      const p = normalizeProps(l.feature.properties);
      depts.push({ id: p.__id, layer: l });
    });
    layerAdm3.eachLayer(l => {
      const p = normalizeProps(l.feature.properties);
      const center = l.getBounds().getCenter();
      const deptFound = depts.find(d => pointInPolygon(center, d.layer));
      if (deptFound) provinceParent[p.__id] = deptFound.id;
    });
  }

  // Ray-casting para saber si un punto está dentro de un polígono/multipolígono Leaflet
  function pointInPolygon(latlng, polygonLayer){
    const latlngs = polygonLayer.getLatLngs(); // puede ser MultiPolygon: arreglo anidado
    const rings = flattenRings(latlngs);
    return rings.some(ring => isPointInRing(latlng, ring));
  }
  function flattenRings(latlngs){
    const rings = [];
    (function walk(arr){
      if (!Array.isArray(arr)) return;
      if (arr.length && arr[0] && 'lat' in arr[0]) { rings.push(arr); return; }
      arr.forEach(walk);
    })(latlngs);
    return rings;
  }
  function isPointInRing(pt, ring){
    let x = pt.lng, y = pt.lat;
    let inside = false;
    for (let i=0, j=ring.length-1; i<ring.length; j=i++){
      const xi = ring[i].lng, yi = ring[i].lat;
      const xj = ring[j].lng, yj = ring[j].lat;
      const intersect = ((yi>y)!==(yj>y)) && (x < (xj - xi)*(y - yi)/(yj - yi + 1e-12) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  async function tryLoadMunicipios(){
    try {
      const res = await fetch('/geo/bolivia_municipios.geojson');
      if (!res.ok) throw new Error('Municipios no encontrados');
      const municipios = await res.json();
      // Filtrar municipios cuyo centroide esté dentro de la provincia seleccionada
      const lyrProv = findLayerById(layerAdm3, 'adm3', state.selectedProvId);
      if (!lyrProv) return;
      const provLayer = lyrProv; // Leaflet layer
      const feats = municipios.features.filter(f => {
        const gj = L.geoJSON(f);
        let center = null;
        gj.eachLayer(ll => { center = ll.getBounds().getCenter(); });
        return center ? pointInPolygon(center, provLayer) : false;
      });
      if (feats.length){
        const fc = { type:'FeatureCollection', features: feats };
        municipiosLayer = L.geoJSON(fc, { renderer: canvasRenderer, style: { color:'#6a1b9a', weight: 1, fillColor:'#ce93d8', fillOpacity: 0.5 } });
        municipiosLayer.addTo(map);
      } else {
        notify('No se encontraron municipios para esta provincia (verifica el dataset).');
      }
    } catch(e){
      notify('Dataset de municipios no disponible. Añade /public/geo/bolivia_municipios.geojson');
    }
  }

  function notify(msg){
    // Nota simple en el panel
    if (!modeNav) return; const el = document.createElement('div'); el.className='small'; el.style.color = '#b23a48'; el.style.marginTop = '4px'; el.textContent = msg; modeNav.appendChild(el);
  }

  function findLayerById(layerGroupOrGeoJson, level, id){
    let found = null;
    layerGroupOrGeoJson.eachLayer(l => {
      const p = normalizeProps(l.feature.properties);
      if (p.__id === id) found = l;
    });
    return found;
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
  strokeInput.addEventListener('input', () => {
    state.strokeOverrideColor = strokeInput.value;
    if(state.active.id){
      state.styles[state.active.level][state.active.id].stroke = strokeInput.value;
    }
    refreshStyles();
  });
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
  if (restBoliviaRange) {
    restBoliviaRange.addEventListener('input', () => { state.attenuationRestBolivia = parseFloat(restBoliviaRange.value)||0; refreshStyles(); });
  }
  if (deptAttenuationRange) {
    deptAttenuationRange.addEventListener('input', () => { state.attenuationDepartment = parseFloat(deptAttenuationRange.value)||0; refreshStyles(); });
  }
  toggleAdm1.addEventListener('change', syncUI);
  toggleAdm3.addEventListener('change', () => { syncUI(); renderMode(); });

  if (btnModeBolivia) btnModeBolivia.addEventListener('click', () => setMode('bolivia'));
  if (btnModeDepartamento) btnModeDepartamento.addEventListener('click', () => setMode('departamento'));
  if (btnModeProvincia) btnModeProvincia.addEventListener('click', () => setMode('provincia'));
  if (btnBack) btnBack.addEventListener('click', () => {
    if (state.mode === 'departamento'){
      state.selectedDeptId = null; state.selectedProvId = null; renderMode();
    } else if (state.mode === 'provincia'){
      if (state.selectedProvId){ state.selectedProvId = null; renderMode(); }
      else { state.selectedDeptId = null; renderMode(); }
    }
  });

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
