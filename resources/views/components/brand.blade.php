@props(['compact' => false, 'inverse' => false])
<a href="{{ url('/') }}" {{ $attributes->class(['brand', 'brand--compact' => $compact, 'brand--inverse' => $inverse]) }} aria-label="{{ config('institution.name') }}, inicio">
    <img
        class="brand__logo"
        src="{{ asset(config('institution.logo')) }}"
        alt="Logo oficial de {{ config('institution.name') }}"
        width="176"
        height="91"
    >
    @unless($compact)
        <span class="brand__text">
            <strong>{{ config('institution.application_name') }}</strong>
            <small>por {{ config('institution.name') }}</small>
        </span>
    @endunless
</a>
