import { jsPDF } from 'jspdf';

// Encapsular para permitir early return sin romper Rollup
(function(){
  if(!document.getElementById('mapCanvas')) return; // no ejecutar fuera de la vista mapa

/*
 * Mapa de Bolivia simplificado con polígonos aproximados.
 * Cada departamento: id, nombre, color, textoColor, paths: [ [ [x,y], ... ] ]
 * Coordenadas base normalizadas a una caja de 1000x1000 para fácil escalado.
 */
const departamentos = [
  { id: 'lp', nombre: 'La Paz', color: '#cfd8dc', textoColor:'#000', paths: [ [ [280,180],[350,120],[420,140],[460,210],[450,260],[400,300],[340,280],[300,240] ] ] },
  { id: 'or', nombre: 'Oruro', color: '#ffe0b2', textoColor:'#000', paths: [ [ [340,280],[400,300],[390,360],[330,370],[300,340] ] ] },
  { id: 'po', nombre: 'Potosí', color: '#f8bbd0', textoColor:'#000', paths: [ [ [330,370],[390,360],[430,400],[420,470],[360,480],[310,430] ] ] },
  { id: 'co', nombre: 'Cochabamba', color: '#dcedc8', textoColor:'#000', paths: [ [ [400,300],[450,310],[500,350],[470,390],[430,400],[390,360] ] ] },
  { id: 'ch', nombre: 'Chuquisaca', color: '#ddffff', textoColor:'#000', paths: [ [ [360,480],[420,470],[470,520],[430,560],[370,550] ] ] },
  { id: 'ta', nombre: 'Tarija', color: '#fff9c4', textoColor:'#000', paths: [ [ [370,550],[430,560],[440,620],[400,650],[360,630] ] ] },
  { id: 'sc', nombre: 'Santa Cruz', color: '#c8e6c9', textoColor:'#000', paths: [ [ [500,350],[560,330],[640,360],[660,420],[650,470],[600,520],[540,500],[470,520],[430,400],[470,390] ] ] },
  { id: 'be', nombre: 'Beni', color: '#b3e5fc', textoColor:'#000', paths: [ [ [460,210],[520,200],[580,220],[600,260],[560,330],[500,350],[450,310],[400,300],[450,260] ] ] },
  { id: 'pd', nombre: 'Pando', color: '#d1c4e9', textoColor:'#000', paths: [ [ [420,140],[500,120],[560,140],[520,200],[460,210],[450,260],[400,300],[350,120] ] ] }
];

// Coordenadas para etiquetas (centroides aproximados)
const labelPositions = {
  lp: [360,220], or: [360,320], po: [360,420], co: [440,350], ch: [400,520], ta: [395,600], sc: [560,430], be: [500,270], pd: [480,170]
};

const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');

const dpr = window.devicePixelRatio || 1;
canvas.width = canvas.width * dpr;
canvas.height = canvas.height * dpr;
ctx.scale(dpr, dpr);

let scale = 0.7; // escala inicial para que quepa
let translate = { x: 150, y: 80 };
let dragging = false;
let lastPos = { x:0, y:0 };
let currentDeptId = null;

const departamentosList = document.getElementById('departamentosList');
const colorFill = document.getElementById('colorFill');
const colorStroke = document.getElementById('colorStroke');
const colorText = document.getElementById('colorText');
const zoomRange = document.getElementById('zoomRange');

const btnExportPNG = document.getElementById('btnExportPNG');
const btnExportJPG = document.getElementById('btnExportJPG');
const btnExportPDF = document.getElementById('btnExportPDF');
const btnReset = document.getElementById('btnReset');

function buildDeptButtons(){
  departamentos.forEach(d => {
    const b = document.createElement('button');
    b.textContent = d.nombre;
    b.dataset.id = d.id;
    b.addEventListener('click', () => {
      currentDeptId = d.id;
      document.querySelectorAll('#departamentosList button').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      colorFill.value = d.color;
      colorText.value = d.textoColor;
      draw();
    });
    departamentosList.appendChild(b);
  });
}

function worldToScreen([x,y]){ return [ x*scale + translate.x, y*scale + translate.y ]; }

function pointInPolygon(pt, vs){
  const x = pt[0], y = pt[1];
  let inside = false;
  for(let i=0,j=vs.length-1;i<vs.length;j=i++){
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
    const intersect = ((yi>y)!=(yj>y)) && (x < (xj - xi)*(y - yi)/(yj - yi) + xi);
    if(intersect) inside = !inside;
  }
  return inside;
}

function screenToWorld(x,y){
  return [ (x - translate.x)/scale, (y - translate.y)/scale ];
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.save();
  ctx.scale(1,1); // dpr ya aplicado
  departamentos.forEach(d => {
    ctx.beginPath();
    d.paths.forEach(path => {
      path.forEach(([px,py],i)=>{
        const [sx,sy] = worldToScreen([px,py]);
        if(i===0) ctx.moveTo(sx,sy); else ctx.lineTo(sx,sy);
      });
    });
    ctx.closePath();
    ctx.fillStyle = d.color;
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1.2;
    ctx.fill();
    ctx.stroke();
  });
  // Etiquetas
  departamentos.forEach(d => {
    const lp = labelPositions[d.id];
    if(!lp) return;
    const [sx,sy] = worldToScreen(lp);
    ctx.fillStyle = d.textoColor || '#000';
    ctx.font = `${14*scale}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(d.nombre, sx, sy);
  });
  ctx.restore();
}

canvas.addEventListener('mousedown', e => {
  if(e.button===0){
    dragging = true; lastPos={x:e.clientX, y:e.clientY};
  }
});
window.addEventListener('mouseup', ()=> dragging=false);
window.addEventListener('mousemove', e => {
  if(dragging){
    translate.x += (e.clientX - lastPos.x);
    translate.y += (e.clientY - lastPos.y);
    lastPos = { x:e.clientX, y:e.clientY };
    draw();
  }
});

canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left);
  const y = (e.clientY - rect.top);
  const world = screenToWorld(x,y);
  // detectar departamento
  for(const d of departamentos){
    if(d.paths.some(p => pointInPolygon(world, p))){
      currentDeptId = d.id;
      document.querySelectorAll('#departamentosList button').forEach(x=>x.classList.remove('active'));
      const b = document.querySelector(`#departamentosList button[data-id='${d.id}']`);
      if(b) b.classList.add('active');
      colorFill.value = d.color;
      colorText.value = d.textoColor;
      draw();
      break;
    }
  }
});

zoomRange.addEventListener('input', () => {
  const prevScale = scale;
  const newScale = parseFloat(zoomRange.value);
  // zoom hacia el centro
  const cx = canvas.width/(2*dpr); const cy = canvas.height/(2*dpr);
  // Convertir centro a mundo, ajustar translate para mantener enfoque
  const worldCenterBefore = screenToWorld(cx, cy);
  scale = newScale;
  const screenCenterAfter = worldToScreen(worldCenterBefore);
  translate.x += (cx - screenCenterAfter[0]);
  translate.y += (cy - screenCenterAfter[1]);
  draw();
});

colorFill.addEventListener('input', () => {
  if(!currentDeptId) return; const d = departamentos.find(x=>x.id===currentDeptId); d.color = colorFill.value; draw();
});
colorText.addEventListener('input', () => {
  if(!currentDeptId) return; const d = departamentos.find(x=>x.id===currentDeptId); d.textoColor = colorText.value; draw();
});
// colorStroke permitiría personalizar borde por depto (opcional): se puede ampliar guardando strokeColor en cada depto

btnReset.addEventListener('click', () => {
  scale = 0.7; translate = {x:150, y:80}; zoomRange.value = 1; draw();
});

function exportImage(type='png'){
  const exportCanvas = document.createElement('canvas');
  const exportScale = 2; // alta resolución
  exportCanvas.width = 1200*exportScale;
  exportCanvas.height = 800*exportScale;
  const exCtx = exportCanvas.getContext('2d');
  exCtx.scale(exportScale, exportScale);
  // Dibujar sin transformaciones de pan/zoom: normalizar a que el mapa ocupe área principal
  const savedScale = scale, savedTranslate = {...translate};
  const baseScale = 0.8; const baseTranslate = {x:100, y:40};
  scale = baseScale; translate = baseTranslate;
  // Dibujo reutilizando la misma función con contexto distinto no es trivial, copiamos lógica simplificada
  departamentos.forEach(d => {
    exCtx.beginPath();
    d.paths.forEach(path => {
      path.forEach(([px,py],i)=>{
        const sx = px*scale + translate.x;
        const sy = py*scale + translate.y;
        if(i===0) exCtx.moveTo(sx,sy); else exCtx.lineTo(sx,sy);
      });
    });
    exCtx.closePath();
    exCtx.fillStyle = d.color; exCtx.strokeStyle = '#222'; exCtx.lineWidth = 1; exCtx.fill(); exCtx.stroke();
  });
  departamentos.forEach(d => {
    const lp = labelPositions[d.id]; if(!lp) return; const sx = lp[0]*scale + translate.x; const sy = lp[1]*scale + translate.y; exCtx.fillStyle = d.textoColor; exCtx.font = `16px Arial`; exCtx.textAlign='center'; exCtx.textBaseline='middle'; exCtx.fillText(d.nombre, sx, sy);
  });
  // restaurar
  scale = savedScale; translate = savedTranslate;
  draw();
  const mime = type==='jpg' ? 'image/jpeg' : 'image/png';
  const data = exportCanvas.toDataURL(mime, 0.92);
  const a = document.createElement('a');
  a.href = data; a.download = `mapa-bolivia.${type}`; a.click();
}

btnExportPNG.addEventListener('click', ()=> exportImage('png'));
btnExportJPG.addEventListener('click', ()=> exportImage('jpg'));

btnExportPDF.addEventListener('click', () => {
  const pdf = new jsPDF({orientation:'landscape', unit:'px', format:[1200,800]});
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = 1200; exportCanvas.height = 800;
  const exCtx = exportCanvas.getContext('2d');
  const savedScale = scale, savedTranslate = {...translate};
  scale = 0.8; translate = {x:100, y:40};
  departamentos.forEach(d => {
    exCtx.beginPath();
    d.paths.forEach(path => {
      path.forEach(([px,py],i)=>{
        const sx = px*scale + translate.x; const sy = py*scale + translate.y; if(i===0) exCtx.moveTo(sx,sy); else exCtx.lineTo(sx,sy);
      });
    });
    exCtx.closePath(); exCtx.fillStyle=d.color; exCtx.strokeStyle='#222'; exCtx.lineWidth=1; exCtx.fill(); exCtx.stroke();
  });
  departamentos.forEach(d => { const lp = labelPositions[d.id]; if(!lp) return; const sx = lp[0]*scale + translate.x; const sy = lp[1]*scale + translate.y; exCtx.fillStyle=d.textoColor; exCtx.font='16px Arial'; exCtx.textAlign='center'; exCtx.textBaseline='middle'; exCtx.fillText(d.nombre, sx, sy); });
  scale = savedScale; translate = savedTranslate; draw();
  const img = exportCanvas.toDataURL('image/png');
  pdf.addImage(img, 'PNG', 0, 0, 1200, 800);
  pdf.save('mapa-bolivia.pdf');
});

buildDeptButtons();
currentDeptId = departamentos[0].id;
// activar primer botón
const firstButton = document.querySelector('#departamentosList button'); if(firstButton) firstButton.classList.add('active');
colorFill.value = departamentos[0].color;
colorText.value = departamentos[0].textoColor;

// Inicial
zoomRange.value = 1;
draw();
})();
