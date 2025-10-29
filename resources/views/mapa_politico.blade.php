<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <title>Mapa Político de Bolivia</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
    @vite(['resources/js/app.js','resources/css/app.css'])
    <style>
        *, *::before, *::after { box-sizing: border-box; }
        :root{
            --c-primary: rgb(38,186,165);
            --c-dark: rgb(55,95,122);
            --c-light-bg: #f3fbf9;
        }
        body {margin:0; font-family: Arial, sans-serif; background:#fff; overflow-x:hidden;}
    .layout {display:flex; height:100vh; width:100vw;}
        #panel {width:320px; background:var(--c-light-bg); padding:12px; border-right:3px solid var(--c-dark); overflow:auto;}
    #map {flex:1; height:100vh; width:calc(100vw - 320px);}        
        .section {margin-bottom:14px;}
        .section h3 {margin:8px 0; font-size:14px; color:var(--c-dark)}
        #adm1Btns, #adm3Btns {display:flex; flex-wrap:wrap; gap:4px;}
        .dept-btn {padding:4px 8px; font-size:12px; border:1px solid var(--c-dark); background:#fff; cursor:pointer; border-radius:4px; color:var(--c-dark)}
        .dept-btn:hover {background: rgba(38,186,165,0.12)}
        .dept-btn.active {background:var(--c-primary); color:#fff; border-color:var(--c-primary);}
    .label-span {font: 11px/1 Arial; font-weight:bold; color:#111;}
        #legend {font-size:12px;}
        .color-box {display:inline-block; width:14px; height:14px; vertical-align:middle; margin-right:4px; border:1px solid #333;}
        #exportBtns button {margin-right:6px; background: var(--c-dark); color:#fff; border: none; padding:6px 10px; border-radius:4px; cursor:pointer}
        #exportBtns button:hover {filter: brightness(1.05)}
        .flex-col {display:flex; flex-direction:column; gap:6px;}
        .small {font-size:12px; color:#4d5f6f;}

        /* Prevalecer paleta en inputs nativos */
        input[type="checkbox"], input[type="range"], select { accent-color: var(--c-primary); }
    .flex-col > label { display:flex; align-items:center; justify-content:space-between; gap:8px; color: var(--c-dark); }
    .flex-col > label > span { flex: 1 1 auto; }
    /* Filas específicas para color (no usan <label> para evitar clic accidental) */
    .flex-col .control-row { display:flex; align-items:center; justify-content:space-between; gap:8px; color: var(--c-dark); }
    .control-row .control-label { flex: 1 1 auto; }
        /* Reducir el input color a un swatch compacto */
        input[type="color"]{ -webkit-appearance: none; appearance: none; border: 1px solid var(--c-dark); width: 34px; height: 24px; padding: 0; background: transparent; border-radius: 4px; cursor: pointer; flex: 0 0 auto; }
        input[type="color"]::-webkit-color-swatch-wrapper { padding:0; }
        input[type="color"]::-webkit-color-swatch { border: none; border-radius: 3px; }
        input[type="color"]::-moz-color-swatch { border: none; border-radius: 3px; }
        /* Rango más integrado con la paleta */
    input[type="range"]{ width: 140px; }
        @media (max-width: 360px){ input[type="range"]{ width: 100px; } }

        /* Toggle del panel */
        .panel-fab {position: fixed; top: 12px; left: 12px; z-index: 1000; background: var(--c-dark); color: #fff; border: none; border-radius: 20px; padding: 8px 10px; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.2)}
        .panel-fab:hover {filter: brightness(1.05)}
        .hide-panel {background: transparent; color: var(--c-dark); border: 1px solid var(--c-dark); padding: 4px 8px; border-radius: 4px; cursor: pointer;}
        .hide-panel:hover {background: rgba(55,95,122,0.08)}
        .panel-header {display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid rgba(55,95,122,0.2); padding-bottom:6px; margin-bottom:8px}
        .panel-title {font-weight:bold; color: var(--c-dark)}

        /* Estados: ocultar panel y mostrar FAB */
        .panel-fab {display:none}
        body.panel-hidden #panel {display:none}
        body.panel-hidden .panel-fab {display:block}

        /* Modo móvil: panel arriba y ocultar provincias */
        @media (max-width: 768px){
            .layout {flex-direction: column;}
            #panel {
                position: sticky; top: 0; z-index: 500; width: 100%;
                border-right: none; border-bottom: 3px solid var(--c-dark);
                padding-right: clamp(16px, 4vw, 28px);
                padding-left: clamp(12px, 3vw, 20px);
                max-width: 100vw;
            }
            #map {width: 100%; height: auto; flex: 1 1 auto; min-height: calc(100vh - 220px);}/* asegura área de mapa visible */
            .hide-on-mobile {display: none !important;}
            /* Reacomodar controles para no cortarlos */
            .flex-col > label { flex-direction: column; align-items: flex-start; gap: 4px; }
            .flex-col > label > span { width: 100%; }
            .flex-col .control-row { flex-direction: column; align-items: flex-start; gap: 4px; }
            .control-row .control-label { width: 100%; }
            input[type="range"]{ width: 100%; max-width: 100%; }
            input[type="color"]{ width: 38px; height: 28px; }
            #exportBtns button { width: auto; }
        }
    </style>
</head>
<body>
<button class="panel-fab" id="openPanelBtn" title="Mostrar opciones">☰ Opciones</button>
<div class="layout">
    <div id="panel">
        <div class="panel-header">
            <div class="panel-title">Opciones</div>
            <button id="hidePanelBtn" class="hide-panel" title="Ocultar">Ocultar</button>
        </div>
        <div class="section" id="modeSection">
            <h3>Menú</h3>
            <div style="display:flex; gap:6px; flex-wrap:wrap">
                <button class="dept-btn" id="btnModeBolivia">Bolivia</button>
                <button class="dept-btn" id="btnModeDepartamento">Departamentos</button>
                <button class="dept-btn" id="btnModeProvincia">Provincia</button>
                <button class="hide-panel" id="btnBack" style="margin-left:auto" title="Atrás">Atrás</button>
            </div>
            <div id="modeNav" class="small" style="margin-top:6px; color:#2b3e4f"></div>
        </div>
        <div class="section hide-on-mobile" id="sectionLayers">
            <h3>Capas</h3>
            <label><input type="checkbox" id="toggleAdm1" checked /> Departamentos</label>
            <label class="hide-on-mobile"><input type="checkbox" id="toggleAdm3" /> Provincias</label>
        </div>
        <div class="section" id="stylesSection" style="display:none">
            <h3>Estilos</h3>
            <div class="flex-col">
                <div class="control-row"><div class="control-label">Color área</div><input type="color" id="colorFill" value="#66bb6a"></div>
                <div class="control-row"><div class="control-label">Color borde</div><input type="color" id="colorStroke" value="#222222"></div>
                <div class="control-row"><div class="control-label">Color texto</div><input type="color" id="colorText" value="#000000"></div>
                <label>Opacidad <input type="range" min="0.2" max="1" step="0.05" id="opacityRange" value="0.8" /></label>
                <label>Grosor borde <input type="range" min="0.5" max="4" step="0.1" id="strokeWidthRange" value="1.2" /></label>
                <label>Atenuación mundo <input type="range" min="0" max="1" step="0.01" id="worldOpacityRange" value="0.05" /></label>
                <label id="rowRestBolivia" style="display:none"><span>Atenuación resto de Bolivia</span> <input type="range" min="0" max="1" step="0.01" id="restBoliviaRange" value="0.6"></label>
                <label id="rowDeptAtt" style="display:none"><span>Atenuación de departamento</span> <input type="range" min="0" max="1" step="0.01" id="deptAttenuationRange" value="0.5"></label>
                <div style="border-top:1px dashed #ddd; margin-top:6px; padding-top:6px;"></div>
                <label><span>Fondo/halo de texto</span> <input type="checkbox" id="toggleTextHalo" checked></label>
                <label><span>Color halo</span> <input type="color" id="textHaloColor" value="#ffffff"></label>
                <label><span>Ancho halo</span> <input type="range" min="0" max="8" step="1" id="textHaloWidth" value="3"></label>
            </div>
        </div>
        <div class="section" id="sectionDeptList" style="display:none">
            <h3>Departamentos</h3>
            <div id="adm1Btns"></div>
        </div>
        <div class="section" id="sectionProvList" style="display:none">
            <h3>Provincias</h3>
            <div id="adm3Btns"></div>
        </div>
        <div class="section" id="exportBtns">
            <h3>Exportar</h3>
            <button id="btnExportPNG">PNG</button>
            <button id="btnExportPDF">PDF</button>
            <button id="btnReset">Reset Vista</button>
        </div>
        <div class="section hide-on-mobile" id="legend">
            <h3>Leyenda</h3>
            <div id="legendContent"></div>
        </div>
    </div>
    <div id="map"></div>
</div>
<script>
    (function(){
        const body = document.body;
        const openBtn = document.getElementById('openPanelBtn');
        const hideBtn = document.getElementById('hidePanelBtn');
        if(openBtn){ openBtn.addEventListener('click', () => body.classList.remove('panel-hidden')); }
        if(hideBtn){ hideBtn.addEventListener('click', () => body.classList.add('panel-hidden')); }
        // Desactivar provincias por defecto en móvil
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        if(isMobile){
            const t3 = document.getElementById('toggleAdm3');
            if(t3){ t3.checked = false; }
        }
    })();
    </script>
</body>
</html>