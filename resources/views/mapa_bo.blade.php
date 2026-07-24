<!DOCTYPE html>
<html lang="es-BO">
<head>
    <x-seo
        title="Visualizador geográfico de Bolivia"
        description="Visualiza información geográfica de Bolivia en un mapa interactivo desarrollado por IFE Educabol."
    />
    @vite(['resources/js/app.js', 'resources/css/app.css'])
</head>
<body>
<a class="skip-link" href="#map-bo">Saltar al mapa</a>
<main class="map-workspace">
    <div class="map-brand-overlay">
        <x-brand compact />
        <a class="workspace-home" href="{{ url('/') }}" aria-label="Volver al inicio" title="Volver al inicio">
            <svg class="fa-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 9-8 9 8v10h-6v-6H9v6H3V11Z"/></svg>
        </a>
    </div>
    <div id="map-bo" class="map-surface" data-bo-url="{{ asset('geo/bo.json') }}" role="region" aria-label="Visualizador geográfico de Bolivia"></div>
    <div class="info-box" id="boInfo" style="display:none"></div>
</main>
</body>
</html>
