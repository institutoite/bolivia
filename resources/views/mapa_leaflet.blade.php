<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Mapa Bolivia</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
    <style>
        #map { height: 80vh; }
        #panel { padding:8px; background:#f8f8f8; display:flex; gap:10px; flex-wrap:wrap; }
        .dept-btn { padding:4px 8px; border:1px solid #888; background:#fff; cursor:pointer; }
        .dept-btn.active { background:#007bff; color:#fff; }
        .label { font:12px Arial; font-weight:bold; color:#000; text-shadow:0 0 3px #fff; }
    </style>
</head>
<body>
<div id="panel">
    <div id="departamentosBtns"></div>
    <label>Color área <input type="color" id="colorFill" value="#66bb6a"></label>
    <label>Color borde <input type="color" id="colorStroke" value="#222222"></label>
    <label>Color texto <input type="color" id="colorText" value="#000000"></label>
    <button id="btnExportPNG">PNG</button>
    <button id="btnExportPDF">PDF</button>
</div>
<div id="map"></div>

@vite(['resources/js/mapa-leaflet.js'])
</body>
</html>