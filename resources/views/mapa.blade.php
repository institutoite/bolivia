<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <title>Mapa Interactivo de Bolivia</title>
    @vite(['resources/js/app.js','resources/css/app.css'])
    <style>
        body {font-family: Arial, sans-serif; margin:0; padding:0;}
        #panel {background:#f5f5f5; padding:10px; display:flex; flex-wrap:wrap; gap:10px; align-items:center;}
        #panel label {font-size:12px; display:block;}
        #canvasWrapper {position:relative; width:100%; height:calc(100vh - 120px); overflow:hidden; background:#fff;}
        canvas {background:#fdfdfd; cursor:grab;}
        canvas:active {cursor:grabbing;}
        .dept-color {width:100px;}
        #departamentosList {display:flex; flex-wrap:wrap; gap:6px; max-width:600px;}
        #departamentosList button {padding:4px 6px; border:1px solid #999; background:#fff; cursor:pointer; font-size:12px;}
        #departamentosList button.active {background:#007bff; color:#fff;}
        #exportButtons button {margin-right:8px;}
    </style>
</head>
<body>
<div id="panel">
    <div>
        <strong>Departamento:</strong>
        <div id="departamentosList"></div>
    </div>
    <div>
        <label>Color área
            <input type="color" id="colorFill" value="#66bb6a" />
        </label>
    </div>
    <div>
        <label>Color borde
            <input type="color" id="colorStroke" value="#222222" />
        </label>
    </div>
    <div>
        <label>Color texto
            <input type="color" id="colorText" value="#000000" />
        </label>
    </div>
    <div>
        <label>Zoom
            <input type="range" id="zoomRange" min="0.5" max="3" step="0.01" value="1" />
        </label>
    </div>
    <div id="exportButtons">
        <button id="btnExportPNG">Exportar PNG</button>
        <button id="btnExportJPG">Exportar JPG</button>
        <button id="btnExportPDF">Exportar PDF</button>
        <button id="btnReset">Reiniciar</button>
    </div>
</div>
<div id="canvasWrapper">
    <canvas id="mapCanvas" width="1200" height="800"></canvas>
</div>
</body>
</html>