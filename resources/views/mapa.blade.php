<!DOCTYPE html>
<html lang="es-BO">
<head>
    <x-seo
        title="Editor de mapas de Bolivia"
        description="Edita colores, bordes y etiquetas de un mapa de Bolivia y exporta el resultado en distintos formatos."
    />
    @vite(['resources/js/app.js', 'resources/css/app.css'])
</head>
<body>
<a class="skip-link" href="#mapCanvas">Saltar al editor</a>
<main class="canvas-workspace">
    <div id="panel" class="canvas-toolbar" aria-label="Controles del editor de mapas">
        <div class="canvas-toolbar__brand"><x-brand compact /></div>
        <div class="canvas-control">
            <strong>Departamento</strong>
            <div id="departamentosList"></div>
        </div>
        <div class="canvas-control"><label for="colorFill">Color de área<input type="color" id="colorFill" value="#26baa5"></label></div>
        <div class="canvas-control"><label for="colorStroke">Color de borde<input type="color" id="colorStroke" value="#375f7a"></label></div>
        <div class="canvas-control"><label for="colorText">Color de texto<input type="color" id="colorText" value="#000000"></label></div>
        <div class="canvas-control"><label for="zoomRange">Zoom<input type="range" id="zoomRange" min="0.5" max="3" step="0.01" value="1"></label></div>
        <div id="exportButtons">
            <button type="button" id="btnExportPNG">PNG</button>
            <button type="button" id="btnExportJPG">JPG</button>
            <button type="button" id="btnExportPDF">PDF</button>
            <button type="button" id="btnReset">Restablecer</button>
        </div>
        <a class="workspace-home" href="{{ url('/') }}" aria-label="Volver al inicio" title="Volver al inicio">
            <svg class="fa-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 9-8 9 8v10h-6v-6H9v6H3V11Z"/></svg>
        </a>
    </div>
    <div id="canvasWrapper">
        <canvas id="mapCanvas" width="1200" height="800" aria-label="Lienzo del mapa interactivo de Bolivia"></canvas>
    </div>
</main>
</body>
</html>
