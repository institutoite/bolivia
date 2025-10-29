<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Mapa bo.json — Visualización</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
  @vite(['resources/js/app.js','resources/css/app.css'])
  <style>
    html, body { height:100%; margin:0 }
    #map-bo { width:100%; height:100vh }
    .info-box { position:absolute; top:10px; right:10px; background:#ffffff; border:1px solid rgba(0,0,0,0.1); border-radius:8px; padding:10px; color:#1f2a33; font: 13px/1.3 system-ui, -apple-system, Segoe UI, Roboto }
    .info-box b{color:#375f7a}
  </style>
</head>
<body>
  <div id="map-bo" data-bo-url="{{ asset('geo/bo.json') }}"></div>
  <div class="info-box" id="boInfo" style="display:none"></div>
</body>
</html>
