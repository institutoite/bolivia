@props(['label' => 'Redes sociales de IFE Educabol'])
@php
    $icons = [
        'facebook' => '<path d="M13.5 22v-8h2.8l.42-3.2H13.5V8.75c0-.93.26-1.56 1.62-1.56h1.73V4.33a23 23 0 0 0-2.52-.13c-2.5 0-4.2 1.52-4.2 4.32v2.28H7.3V14h2.83v8h3.37Z"/>',
        'instagram' => '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.7" r="1"/>',
        'youtube' => '<path d="M21.6 7.2a2.8 2.8 0 0 0-2-2C17.85 4.7 12 4.7 12 4.7s-5.85 0-7.6.5a2.8 2.8 0 0 0-2 2A29 29 0 0 0 2 12a29 29 0 0 0 .4 4.8 2.8 2.8 0 0 0 2 2c1.75.5 7.6.5 7.6.5s5.85 0 7.6-.5a2.8 2.8 0 0 0 2-2A29 29 0 0 0 22 12a29 29 0 0 0-.4-4.8ZM10 15.3V8.7l5.7 3.3-5.7 3.3Z"/>',
        'tiktok' => '<path d="M15.6 3c.3 2 1.45 3.25 3.4 3.65v3.18a8.3 8.3 0 0 1-3.35-.78v6.08A5.87 5.87 0 1 1 10.6 9.3v3.25a2.7 2.7 0 1 0 1.75 2.58V3h3.25Z"/>',
    ];
@endphp
<nav class="social-links" aria-label="{{ $label }}">
    @foreach(config('institution.socials') as $network => $url)
        <a href="{{ $url }}" target="_blank" rel="noopener noreferrer" aria-label="{{ ucfirst($network) }} de {{ config('institution.name') }}" title="{{ ucfirst($network) }}">
            <svg class="fa-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">{!! $icons[$network] !!}</svg>
        </a>
    @endforeach
</nav>
