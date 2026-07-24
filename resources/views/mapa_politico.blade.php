<!DOCTYPE html>
<html lang="es-BO">
<head>
    <x-seo
        title="Mapa político interactivo de Bolivia"
        description="Personaliza departamentos y provincias de Bolivia, configura colores y etiquetas, y exporta el mapa en PNG o PDF."
    />
    @vite(['resources/js/app.js', 'resources/css/app.css'])
</head>
<body>
<a class="skip-link" href="#map">Saltar al mapa</a>
<button class="panel-fab" id="openPanelBtn" type="button" title="Mostrar opciones" aria-label="Mostrar opciones">☰ Opciones</button>
<main class="map-workspace">
    <aside id="panel" class="map-panel" aria-label="Opciones del mapa político">
        <div class="workspace-brand">
            <x-brand compact />
            <a class="workspace-home" href="{{ url('/') }}" aria-label="Volver al inicio" title="Volver al inicio">
                <svg class="fa-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 9-8 9 8v10h-6v-6H9v6H3V11Z"/></svg>
            </a>
        </div>
        <header style="margin-bottom:14px">
            <h1 class="workspace-title">Mapa político de Bolivia</h1>
            <p class="workspace-subtitle">Selecciona un territorio y personaliza su presentación.</p>
        </header>
        <div class="panel-header">
            <div class="panel-title">Herramientas</div>
            <button id="hidePanelBtn" class="hide-panel" type="button" title="Ocultar panel">Ocultar</button>
        </div>
        <section class="section" id="modeSection">
            <h3>Nivel territorial</h3>
            <div style="display:flex; gap:6px; flex-wrap:wrap">
                <button class="dept-btn" type="button" id="btnModeBolivia">Bolivia</button>
                <button class="dept-btn" type="button" id="btnModeDepartamento">Departamentos</button>
                <button class="dept-btn" type="button" id="btnModeProvincia">Provincias</button>
                <button class="hide-panel" type="button" id="btnBack" style="margin-left:auto" title="Volver al nivel anterior">Atrás</button>
            </div>
            <div id="modeNav" class="small" style="margin-top:7px"></div>
        </section>
        <section class="section hide-on-mobile" id="sectionLayers">
            <h3>Capas</h3>
            <label><input type="checkbox" id="toggleAdm1" checked> Departamentos</label><br>
            <label class="hide-on-mobile"><input type="checkbox" id="toggleAdm3"> Provincias</label><br>
            <label><input type="checkbox" id="toggleDistricts"> Distritos municipales</label>
        </section>
        <section class="section" id="stylesSection" style="display:none">
            <h3>Apariencia</h3>
            <div class="flex-col">
                <div class="control-row"><div class="control-label">Color de área</div><input type="color" id="colorFill" value="#26baa5" aria-label="Color del área"></div>
                <div class="control-row"><div class="control-label">Color de borde</div><input type="color" id="colorStroke" value="#375f7a" aria-label="Color del borde"></div>
                <div class="control-row"><div class="control-label">Color de texto</div><input type="color" id="colorText" value="#000000" aria-label="Color del texto"></div>
                <label><span>Opacidad</span><input type="range" min="0.2" max="1" step="0.05" id="opacityRange" value="0.8"></label>
                <label><span>Grosor del borde</span><input type="range" min="0.5" max="4" step="0.1" id="strokeWidthRange" value="1.2"></label>
                <label><span>Atenuación mundial</span><input type="range" min="0" max="1" step="0.01" id="worldOpacityRange" value="0.05"></label>
                <label id="rowRestBolivia" style="display:none"><span>Atenuación del resto de Bolivia</span><input type="range" min="0" max="1" step="0.01" id="restBoliviaRange" value="0.6"></label>
                <label id="rowDeptAtt" style="display:none"><span>Atenuación del departamento</span><input type="range" min="0" max="1" step="0.01" id="deptAttenuationRange" value="0.5"></label>
                <label><span>Halo de texto</span><input type="checkbox" id="toggleTextHalo" checked></label>
                <label><span>Color del halo</span><input type="color" id="textHaloColor" value="#ffffff"></label>
                <label><span>Ancho del halo</span><input type="range" min="0" max="8" step="1" id="textHaloWidth" value="3"></label>
            </div>
        </section>
        <section class="section" id="sectionDeptList" style="display:none">
            <h3>Departamentos</h3>
            <div id="adm1Btns"></div>
        </section>
        <section class="section" id="sectionProvList" style="display:none">
            <h3>Provincias</h3>
            <div id="adm3Btns"></div>
            <div id="sectionDistrictList" style="display:none; margin-top:12px; padding-top:10px; border-top:1px solid var(--ife-line)">
                <div class="small" style="margin-bottom:7px; font-weight:750">Distritos municipales</div>
                <div id="districtBtns"></div>
            </div>
        </section>
        <section class="section" id="exportBtns">
            <h3>Exportar</h3>
            <button type="button" id="btnExportPNG">PNG</button>
            <button type="button" id="btnExportPDF">PDF</button>
            <button type="button" id="btnReset">Restablecer</button>
        </section>
        <section class="section hide-on-mobile" id="legend">
            <h3>Leyenda</h3>
            <div id="legendContent"></div>
        </section>
    </aside>
    <div id="map" class="map-surface" role="region" aria-label="Mapa político interactivo de Bolivia"></div>
</main>
<script>
    (() => {
        const body = document.body;
        const openBtn = document.getElementById('openPanelBtn');
        const hideBtn = document.getElementById('hidePanelBtn');
        openBtn?.addEventListener('click', () => body.classList.remove('panel-hidden'));
        hideBtn?.addEventListener('click', () => body.classList.add('panel-hidden'));
        if (window.matchMedia('(max-width: 768px)').matches) {
            const provinces = document.getElementById('toggleAdm3');
            if (provinces) provinces.checked = false;
        }
    })();
</script>
</body>
</html>
