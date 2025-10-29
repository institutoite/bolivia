<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Geodatos — Navegador</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
  @vite(['resources/js/app.js','resources/css/app.css'])
  <style>
    /* Colores personalizados por solicitud */
    :root{ --c-dark: rgb(55,95,122); --c-accent: rgb(38,186,165); }
    html,body{ height:100%; margin:0 }
    body{ font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"; font-size:16px; line-height:1.45; color:#1d2a35 }
    .layout{ display:flex; height:100vh; }
    #sidebar{ width:360px; border-right:2px solid var(--c-dark); padding:12px; overflow:auto }
    #map-geodatos{ flex:1; height:100vh }
    h2{ margin:6px 0 10px; color:var(--c-dark); font-size:22px; font-weight:700 }
    .group{ margin-bottom:14px }
    .group h3{ margin:12px 0 8px; font-size:17px; color:var(--c-dark); font-weight:600 }
    .file-item{ position:relative; display:flex; align-items:center; gap:10px; font-size:15px; margin:6px 0; }
    /* Ocultar el checkbox nativo pero mantener accesibilidad (está enlazado con label mediante id) */
    .file-item input[type="checkbox"]{ position:absolute; left:-9999px; opacity:0; width:0; height:0; }
    /* Apariencia del menú: etiqueta completa clicable y efecto hover */
    .file-item label{ display:block; position:relative; padding:8px 10px 8px 48px; border-radius:8px; cursor:pointer; transition: background-color 160ms ease, color 160ms ease, transform 140ms ease, box-shadow 160ms ease; color: #123; }
  .file-item label:hover{ background: rgba(38,186,165,0.14); color: var(--c-dark); transform: translateX(6px); box-shadow: 0 10px 30px rgba(38,186,165,0.08); }
    .file-item:hover{ background: rgba(0,0,0,0.02); }
    /* Checkbox visual personalizado dentro del label */
    .file-item label::before{ content: ''; position: absolute; left:12px; top:50%; transform: translateY(-50%); width:20px; height:20px; border-radius:6px; border:2px solid var(--c-accent); background: transparent; transition: all 160ms ease; box-shadow: 0 1px 0 rgba(0,0,0,0.04); }
    /* Marca de verificación (usando borders) */
    .file-item label::after{ content: ''; position: absolute; left:16px; top:50%; transform: translateY(-50%) rotate(45deg) scale(0); width:6px; height:12px; border-right:3px solid white; border-bottom:3px solid white; opacity:0; transition: transform 140ms ease, opacity 140ms ease; }
    /* Hover sobre el label hace destacar el checkbox */
    .file-item label:hover::before{ transform: translateY(-50%) scale(1.05); box-shadow: 0 6px 18px rgba(38,186,165,0.08); }
  /* Estado activo cuando checkbox está marcado: fondo degradado y check visible */
  .file-item input[type="checkbox"]:checked + label,
  .file-item.active label { color:#fff; background: linear-gradient(90deg, var(--c-accent), var(--c-dark)); box-shadow: 0 10px 30px rgba(37,150,130,0.16); }
  .file-item input[type="checkbox"]:checked + label::before,
  .file-item.active label::before { transform: translateY(-50%) scale(1.05); border-color: transparent; background: linear-gradient(90deg, var(--c-accent), var(--c-dark)); }
  .file-item input[type="checkbox"]:checked + label::after,
  .file-item.active label::after { transform: translateY(-50%) rotate(45deg) scale(1); opacity:1; }
    .controls{ border-top:1px solid rgba(0,0,0,0.08); margin-top:10px; padding-top:10px; font-size:15px }
    .controls label{ display:flex; justify-content:space-between; align-items:center; gap:10px }
    .btn{ background:var(--c-dark); color:#fff; border:none; border-radius:8px; padding:8px 12px; font-size:15px; cursor:pointer }
    .btn:hover{ filter:brightness(1.05) }
    /* Etiquetas permanentes para ríos */
    .leaflet-tooltip.geodatos-label{
      background: transparent;
      border: none;
      box-shadow: none;
      color: rgb(55,95,122);
      font-weight: 600;
      font-size: 14px;
      letter-spacing: .2px;
      text-shadow:
        -1px -1px 0 rgba(255,255,255,0.85),
         1px -1px 0 rgba(255,255,255,0.85),
        -1px  1px 0 rgba(255,255,255,0.85),
         1px  1px 0 rgba(255,255,255,0.85);
      pointer-events: none;
    }
    /* Etiquetas para puntos (mercados, POIs) al lado del marcador */
    .leaflet-tooltip.geodatos-point-label{
      background: transparent;
      border: none;
      box-shadow: none;
      color: #1d2a35;
      font-weight: 600;
      font-size: 15px;
      letter-spacing: .2px;
      text-shadow:
        -1px -1px 0 rgba(255,255,255,0.9),
         1px -1px 0 rgba(255,255,255,0.9),
        -1px  1px 0 rgba(255,255,255,0.9),
         1px  1px 0 rgba(255,255,255,0.9);
      pointer-events: none;
    }
    /* Popup legible */
    .leaflet-popup-content{ font-size: 15px; line-height: 1.35; }
    .popup-props{ max-width: 280px; }
    .popup-props .pp-title{ font-weight: 700; color: var(--c-dark); margin: 0 0 6px; font-size: 16px; }
    .popup-props dl{ margin: 0; }
    .popup-props dt{ font-weight: 600; color:#234; margin: 6px 0 0; }
    .popup-props dd{ margin: 0 0 6px 0; }
  /* Modal */
  .modal{ position: fixed; inset: 0; display: none; z-index: 10000; }
  .modal.open{ display: block; }
  .modal-backdrop{ position: absolute; inset: 0; background: rgba(0,0,0,0.45); }
  .modal-box{ position: relative; max-width: 560px; width: calc(100% - 24px); margin: 8vh auto; background: #fff; border-radius: 10px; box-shadow: 0 12px 36px rgba(0,0,0,0.28); padding: 16px 16px 18px; border-top: 6px solid var(--c-accent); }
  .modal-close{ position:absolute; top:8px; right:10px; width:34px; height:34px; border:none; border-radius: 8px; background: #eff3f6; color:#213; font-size: 22px; line-height: 1; cursor: pointer; }
  .modal-close:hover{ filter: brightness(0.95) }
  .modal-content{ max-height: 72vh; overflow:auto; }
  #feature-modal-title{ display:none; margin: -16px -16px 12px; padding: 10px 14px; background: var(--c-dark); color: #fff; font-size: 18px; font-weight: 700; border-radius: 8px 8px 0 0; }
  /* Estilo refinado del contenido */
  .modal .popup-props{ max-width: 100%; }
  .modal .popup-props dl{ margin: 0; }
  .modal .popup-props dt{ font-weight: 700; color: var(--c-accent); margin: 10px 0 2px; }
  .modal .popup-props dd{ margin: 0 0 8px 0; padding-bottom: 6px; border-bottom: 1px solid #eef2f6; color: #1d2a35; }
    @media (max-width: 768px){
      .layout{ flex-direction: column; height: 100vh; }
      #sidebar{ width:100%; border-right:none; border-bottom:2px solid var(--c-dark); height:38vh; }
      #map-geodatos{ height:62vh; }
    }
  </style>
</head>
<body>
<div class="layout">
  <aside id="sidebar">
    <h2>Geodatos</h2>
    <div class="small" style="color:#6b7c8a">Activa capas del repositorio geodatos-master</div>
    <div id="groups"></div>
    <div class="controls">
      <label>Atenuación mundo <input type="range" id="worldOpacityGeodatos" min="0" max="1" step="0.01" value="0.05" /></label>
      <div style="display:flex; gap:8px; margin-top:8px">
        <button class="btn" id="btnZoomAll">Zoom a capas</button>
        <button class="btn" id="btnClear">Quitar capas</button>
      </div>
    </div>
  </aside>
  <div id="map-geodatos"></div>
</div>
<script id="geodata-index" type="application/json">{!! json_encode($files, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}</script>
<!-- Modal de detalle de feature -->
<div id="feature-modal" class="modal" aria-hidden="true">
  <div class="modal-backdrop" data-close="true"></div>
  <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="feature-modal-title">
    <button class="modal-close" id="feature-modal-close" aria-label="Cerrar">×</button>
    <div class="modal-content">
      <div class="pp-title" id="feature-modal-title" style="display:none"></div>
      <div class="modal-body" id="feature-modal-body"></div>
    </div>
  </div>
</div>
</body>
</html>
