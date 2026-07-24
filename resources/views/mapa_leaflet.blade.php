<!DOCTYPE html>
<html lang="es-BO">
<head>
    <x-seo
        title="Mapa interactivo de Bolivia"
        description="Selecciona departamentos, cambia colores y exporta un mapa de Bolivia con la herramienta educativa de IFE Educabol."
    />
    @vite(['resources/js/app.js', 'resources/css/app.css'])
</head>
<body>
<main class="map-workspace">
    <aside id="panel" class="map-panel">
        <div class="workspace-brand">
            <x-brand compact />
            <a class="workspace-home" href="{{ url('/') }}" aria-label="Volver al inicio">←</a>
        </div>
        <h1 class="workspace-title">Mapa de Bolivia</h1>
        <div class="section"><h3>Departamentos</h3><div id="departamentosBtns"></div></div>
        <div class="section flex-col">
            <label><span>Color de área</span><input type="color" id="colorFill" value="#26baa5"></label>
            <label><span>Color de borde</span><input type="color" id="colorStroke" value="#375f7a"></label>
            <label><span>Color de texto</span><input type="color" id="colorText" value="#000000"></label>
        </div>
        <div id="exportBtns">
            <button type="button" id="btnExportPNG">PNG</button>
            <button type="button" id="btnExportPDF">PDF</button>
        </div>
    </aside>
    <div id="map" class="map-surface" role="region" aria-label="Mapa interactivo de Bolivia"></div>
</main>
</body>
</html>
