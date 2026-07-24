<!DOCTYPE html>
<html lang="es-BO">
<head>
    <x-seo
        title="Mapas de Bolivia para aprender, crear y exportar"
        description="Personaliza mapas políticos y geográficos de Bolivia, explora capas territoriales y exporta tus resultados con una herramienta educativa de IFE Educabol."
        :canonical="config('institution.url')"
        :image="asset('images/mapa-politico-bolivia-ife-educabol.png')"
    />
    @vite(['resources/js/app.js', 'resources/css/app.css'])
    <script type="application/ld+json">
        {!! json_encode([
            '@context' => 'https://schema.org',
            '@type' => 'WebApplication',
            'name' => config('institution.application_name'),
            'url' => config('institution.url'),
            'applicationCategory' => 'EducationalApplication',
            'operatingSystem' => 'Web',
            'description' => 'Herramienta educativa para personalizar, explorar y exportar mapas de Bolivia.',
            'publisher' => [
                '@type' => 'EducationalOrganization',
                'name' => config('institution.legal_name'),
                'alternateName' => config('institution.name'),
                'url' => config('institution.url'),
                'logo' => asset(config('institution.logo')),
                'sameAs' => array_values(config('institution.socials')),
            ],
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) !!}
    </script>
</head>
<body>
<a class="skip-link" href="#contenido">Saltar al contenido</a>

<header class="site-header">
    <div class="container site-nav">
        <x-brand />
        <button class="nav-toggle" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="main-navigation">
            <svg class="fa-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" fill="none"/></svg>
        </button>
        <nav class="site-nav__links" id="main-navigation" aria-label="Navegación principal">
            <a href="#funciones">Funciones</a>
            <a href="#beneficios">Beneficios</a>
            <a href="#autor">Autor</a>
            <x-whatsapp-link label="Más información" />
        </nav>
    </div>
</header>

<main id="contenido">
    <section class="hero">
        <div class="container hero__grid">
            <div>
                <p class="eyebrow">Tecnología educativa para Bolivia</p>
                <h1>Convierte datos territoriales en <span>mapas claros.</span></h1>
                <p class="hero__copy">Personaliza departamentos, provincias y capas geográficas; ajusta cada detalle y exporta resultados listos para clases, informes y presentaciones.</p>
                <div class="hero__actions">
                    <a class="btn btn-primary" href="{{ url('/mapa-politico') }}">Crear mapa de Bolivia</a>
                    <a class="btn btn-outline" href="{{ url('/geodatos') }}">Explorar Santa Cruz</a>
                </div>
            </div>
            <div class="hero__visual">
                <img src="{{ asset('images/mapa-politico-bolivia-ife-educabol.png') }}" alt="Vista previa del mapa político de Bolivia creado por IFE Educabol" width="951" height="1051" fetchpriority="high">
                <div class="hero__badge">
                    <strong>9 departamentos</strong>
                    <span>Personalización interactiva</span>
                </div>
            </div>
        </div>
    </section>

    <section class="home-section" id="funciones">
        <div class="container">
            <div class="section-heading">
                <p class="eyebrow">Funciones principales</p>
                <h2 class="section-title">Todo lo necesario, sin complicaciones</h2>
                <p class="section-copy">Una experiencia directa para transformar información geográfica en recursos visuales útiles.</p>
            </div>
            <div class="feature-grid">
                <article class="feature-card">
                    <span class="feature-card__icon" aria-hidden="true">01</span>
                    <h3>Personalización visual</h3>
                    <p>Define colores, bordes, opacidad y etiquetas para comunicar mejor cada territorio.</p>
                </article>
                <article class="feature-card">
                    <span class="feature-card__icon" aria-hidden="true">02</span>
                    <h3>Capas geográficas</h3>
                    <p>Explora límites, caminos, hidrografía, servicios y otros datos disponibles por zona.</p>
                </article>
                <article class="feature-card">
                    <span class="feature-card__icon" aria-hidden="true">03</span>
                    <h3>Exportación inmediata</h3>
                    <p>Descarga mapas en PNG o PDF para utilizarlos en materiales educativos y profesionales.</p>
                </article>
            </div>
        </div>
    </section>

    <section class="home-section home-section--soft" id="beneficios">
        <div class="container">
            <div class="section-heading">
                <p class="eyebrow">Beneficios</p>
                <h2 class="section-title">Diseñado para enseñar y comunicar</h2>
            </div>
            <div class="benefit-grid">
                <div class="benefit"><strong>100% web</strong><span>Funciona directamente en tu navegador.</span></div>
                <div class="benefit"><strong>Uso intuitivo</strong><span>Controles claros y accesibles.</span></div>
                <div class="benefit"><strong>Responsive</strong><span>Adaptado a móvil, tableta y escritorio.</span></div>
                <div class="benefit"><strong>Enfoque local</strong><span>Información geográfica de Bolivia.</span></div>
            </div>
        </div>
    </section>

    <section class="home-section" id="servicios">
        <div class="container">
            <div class="services-panel">
                <div>
                    <p class="eyebrow" style="color:#8ee9dc">Servicios de {{ config('institution.name') }}</p>
                    <h2>Formación que conecta educación y tecnología.</h2>
                    <p>{{ config('institution.legal_name') }} impulsa herramientas digitales y experiencias de aprendizaje prácticas para estudiantes y profesionales.</p>
                </div>
                <x-whatsapp-link :application="config('institution.application_name')" label="Hablar con IFE" />
            </div>
        </div>
    </section>

    <section class="home-section home-section--soft" id="autor">
        <div class="container">
            <article class="author-card">
                <img
                    class="author-card__photo"
                    src="{{ asset(config('institution.author_image')) }}"
                    alt="David Flores, autor de Mapas Bolivia para IFE Educabol"
                    width="670"
                    height="772"
                    loading="lazy"
                >
                <div>
                    <p class="eyebrow">Acerca del autor</p>
                    <h2>David Flores</h2>
                    <p>Proyecto desarrollado con pasión por la tecnología y la educación, enfocado en ofrecer una forma simple y efectiva de crear mapas personalizados de Bolivia.</p>
                    <x-social-links label="Redes sociales oficiales de IFE Educabol" />
                </div>
            </article>
        </div>
    </section>
</main>

<footer class="site-footer">
    <div class="container">
        <div class="footer-grid">
            <div>
                <x-brand inverse />
                <p class="footer-note">{{ config('institution.legal_name') }}. Soluciones educativas y herramientas digitales creadas para aprender, explorar y comunicar.</p>
            </div>
            <div>
                <p class="eyebrow" style="color:#8ee9dc">Conecta con nosotros</p>
                <x-social-links />
            </div>
        </div>
        <div class="footer-bottom">
            <span>© {{ date('Y') }} {{ config('institution.name') }}. Todos los derechos reservados.</span>
            <span>{{ config('institution.domain') }}</span>
        </div>
    </div>
</footer>

<x-whatsapp-link :application="config('institution.application_name')" label="Consultar por WhatsApp" floating />

<script>
    (() => {
        const toggle = document.querySelector('.nav-toggle');
        const nav = document.getElementById('main-navigation');
        if (!toggle || !nav) return;
        toggle.addEventListener('click', () => {
            const open = nav.classList.toggle('is-open');
            toggle.setAttribute('aria-expanded', String(open));
        });
        nav.addEventListener('click', (event) => {
            if (event.target.closest('a')) {
                nav.classList.remove('is-open');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });
    })();
</script>
</body>
</html>
