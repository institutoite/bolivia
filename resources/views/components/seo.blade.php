@props([
    'title' => config('institution.application_name'),
    'description' => 'Crea, personaliza y exporta mapas de Bolivia con una herramienta educativa, clara y fácil de usar.',
    'canonical' => null,
    'image' => null,
])
@php
    $fullTitle = $title . ' | ' . config('institution.name');
    $canonicalUrl = $canonical ?: rtrim(config('institution.url'), '/') . request()->getPathInfo();
    $shareImage = $image ?: asset(config('institution.logo'));
@endphp
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{ $fullTitle }}</title>
<meta name="description" content="{{ $description }}">
<meta name="author" content="{{ config('institution.legal_name') }}">
<meta name="theme-color" content="{{ config('institution.colors.primary') }}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="{{ $canonicalUrl }}">
<link rel="icon" type="image/png" href="{{ asset(config('institution.icon')) }}">
<link rel="apple-touch-icon" href="{{ asset(config('institution.icon')) }}">
<link rel="manifest" href="{{ asset('site.webmanifest') }}">
<meta property="og:locale" content="es_BO">
<meta property="og:type" content="website">
<meta property="og:site_name" content="{{ config('institution.name') }}">
<meta property="og:title" content="{{ $fullTitle }}">
<meta property="og:description" content="{{ $description }}">
<meta property="og:url" content="{{ $canonicalUrl }}">
<meta property="og:image" content="{{ $shareImage }}">
<meta property="og:image:alt" content="Identidad oficial de {{ config('institution.name') }}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{{ $fullTitle }}">
<meta name="twitter:description" content="{{ $description }}">
<meta name="twitter:image" content="{{ $shareImage }}">
