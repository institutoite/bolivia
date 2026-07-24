@props(['application' => null, 'label' => 'Consultar por WhatsApp', 'floating' => false])
@php
    $appName = $application ?: config('institution.application_name');
    $message = str_replace(':application', $appName, config('institution.whatsapp.message'));
    $url = 'https://wa.me/' . config('institution.whatsapp.number') . '?text=' . rawurlencode($message);
@endphp
<a
    href="{{ $url }}"
    target="_blank"
    rel="noopener noreferrer"
    {{ $attributes->class(['whatsapp-link', 'whatsapp-link--floating' => $floating]) }}
    aria-label="{{ $label }}"
>
    <svg class="fa-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 3.5A11.8 11.8 0 0 0 12.1 0C5.55 0 .23 5.32.23 11.87c0 2.1.55 4.15 1.6 5.95L.13 24l6.32-1.66a11.9 11.9 0 0 0 5.66 1.44h.01C18.67 23.78 24 18.46 24 11.9c0-3.17-1.24-6.15-3.5-8.4ZM12.12 21.77a9.9 9.9 0 0 1-5.05-1.38l-.36-.22-3.75.99 1-3.66-.24-.38a9.84 9.84 0 0 1-1.5-5.25c0-5.45 4.44-9.88 9.9-9.88a9.8 9.8 0 0 1 7 2.9 9.82 9.82 0 0 1 2.9 7c0 5.45-4.44 9.88-9.9 9.88Zm5.42-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47a8.9 8.9 0 0 1-1.65-2.05c-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.42.25-.7.25-1.31.18-1.44-.08-.12-.28-.2-.58-.35Z"/></svg>
    <span>{{ $label }}</span>
</a>
