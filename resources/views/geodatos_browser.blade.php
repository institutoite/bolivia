<!DOCTYPE html>
<html lang="es-BO">
<head>
    <x-seo
        title="Explorador de geodatos de Santa Cruz"
        description="Explora capas geográficas de Santa Cruz, Bolivia: límites, hidrografía, caminos, servicios e información territorial."
    />
    @vite(['resources/js/app.js', 'resources/css/app.css'])
</head>
<body>
<a class="skip-link" href="#map-geodatos">Saltar al mapa</a>
<main class="map-workspace">
    <aside id="sidebar" aria-label="Controles de capas geográficas">
        <div class="workspace-brand">
            <x-brand compact />
            <a class="workspace-home" href="{{ url('/') }}" aria-label="Volver al inicio" title="Volver al inicio">
                <svg class="fa-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 9-8 9 8v10h-6v-6H9v6H3V11Z"/></svg>
            </a>
        </div>
        <header style="margin-bottom:16px">
            <h1 class="workspace-title">Explorador de geodatos</h1>
            <p class="workspace-subtitle">Activa y combina capas territoriales de Santa Cruz.</p>
        </header>
        <div id="groups"></div>
        <div id="districtMenu"></div>
        <div class="controls">
            <label for="worldOpacityGeodatos">Atenuación del mapa
                <input type="range" id="worldOpacityGeodatos" min="0" max="1" step="0.01" value="0.05">
            </label>
            <div style="display:flex; gap:8px; margin-top:12px">
                <button class="btn" type="button" id="btnZoomAll">Ver capas</button>
                <button class="btn" type="button" id="btnClear">Limpiar</button>
            </div>
        </div>
    </aside>
    <div id="map-geodatos" class="map-surface" role="region" aria-label="Mapa interactivo de geodatos"></div>
</main>

<script id="geodata-index" type="application/json">{!! json_encode($files, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}</script>
<div id="feature-modal" class="modal" aria-hidden="true">
    <div class="modal-backdrop" data-close="true"></div>
    <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="feature-modal-title">
        <button class="modal-close" type="button" id="feature-modal-close" aria-label="Cerrar">×</button>
        <div class="modal-content">
            <div class="pp-title" id="feature-modal-title" style="display:none"></div>
            <div class="modal-body" id="feature-modal-body"></div>
        </div>
    </div>
</div>
</body>
</html>
