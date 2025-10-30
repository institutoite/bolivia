<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Mapas de Bolivia — Personaliza y Exporta</title>
  <link rel="icon" href="{{ asset('favicon.ico') }}" type="image/x-icon">
  @vite(['resources/js/app.js','resources/css/app.css'])
  <style>
    :root{
      --c-primary: rgb(38,186,165);
      --c-secondary: rgb(55,95,122);
      --c-bg: #f6fbfa;
      --c-ink: #1f2a33;
      --c-muted: #6b7c8a;
    }
    *{box-sizing:border-box}
    body{margin:0; font-family:system-ui, -apple-system, Segoe UI, Roboto, Arial; color:var(--c-ink); background:#fff}
    a{color:inherit; text-decoration:none}
    .container{max-width:1100px; margin:0 auto; padding:0 20px}
    /* Header */
    .header{position:sticky; top:0; z-index:50; background:#fff; border-bottom:1px solid rgba(0,0,0,0.06)}
    .nav{display:flex; align-items:center; justify-content:space-between; height:64px}
    .brand{display:flex; align-items:center; gap:10px; font-weight:800; color:var(--c-secondary)}
    .brand-logo{width:28px; height:28px; border-radius:6px; background:linear-gradient(135deg, var(--c-primary), var(--c-secondary))}
    .nav-links{display:flex; gap:16px; align-items:center}
    .nav-links a{padding:8px 10px; border-radius:6px; color:var(--c-secondary)}
    .nav-links a:hover{background:rgba(55,95,122,0.08)}
    .btn{display:inline-flex; align-items:center; gap:8px; padding:10px 14px; border-radius:8px; border:none; cursor:pointer; font-weight:600}
    .btn-primary{background:var(--c-primary); color:#fff}
    .btn-primary:hover{filter:brightness(1.05)}
    .btn-outline{background:transparent; color:var(--c-secondary); border:1px solid var(--c-secondary)}
    .btn-outline:hover{background:rgba(55,95,122,0.08)}
    /* Hero */
    .hero{background:var(--c-bg); padding:48px 0}
    .hero-wrap{display:grid; grid-template-columns: 1.1fr 0.9fr; gap:28px; align-items:center}
    .hero h1{font-size:clamp(28px, 4vw, 44px); line-height:1.1; margin:0 0 12px}
    .hero p{font-size:clamp(14px, 2.2vw, 18px); color:var(--c-muted); margin:0 0 16px}
    .cta-row{display:flex; gap:12px; flex-wrap:wrap}
    .hero-img{width:100%; aspect-ratio: 4/3; border-radius:14px; background:#e9f3f1; border:2px dashed rgba(55,95,122,0.3); display:flex; align-items:center; justify-content:center; color:var(--c-muted)}
    /* Features */
    .features{padding:28px 0}
    .grid{display:grid; grid-template-columns: repeat(4,1fr); gap:16px}
    .card{border:1px solid rgba(0,0,0,0.06); border-radius:12px; padding:16px; background:#fff}
    .card h3{margin:0 0 6px; color:var(--c-secondary)}
    .soon{display:inline-block; padding:2px 8px; font-size:12px; border-radius:999px; background:rgba(55,95,122,0.1); color:var(--c-secondary); margin-left:8px}
    /* Section blocks */
    section{padding:36px 0}
    .section-title{font-size:22px; margin:0 0 10px; color:var(--c-secondary)}
    .section-sub{color:var(--c-muted); margin:0 0 12px}
    /* Socials */
    .socials{display:flex; gap:10px}
    .socials a{width:36px; height:36px; display:inline-flex; align-items:center; justify-content:center; border-radius:8px; border:1px solid rgba(0,0,0,0.08); color:var(--c-secondary)}
    .socials a:hover{background:rgba(55,95,122,0.08)}
    /* Footer */
    .footer{border-top:1px solid rgba(0,0,0,0.06); padding:18px 0; color:var(--c-muted)}
    /* Responsive */
    @media (max-width: 960px){ .grid{grid-template-columns: repeat(2,1fr)} .hero-wrap{grid-template-columns: 1fr} }
    @media (max-width: 520px){ .grid{grid-template-columns: 1fr} .nav-links{display:none} }
  </style>
</head>
<body>
  <!-- Header -->
  <header class="header">
    <div class="container nav">
      <a href="/" class="brand"><span class="brand-logo"></span>Mapas Bolivia</a>
      <nav class="nav-links">
        <a href="#personaliza">Personaliza tu mapa</a>
        <a href="#proximamente">Próximamente</a>
        <a href="#autor">Acerca del autor</a>
        
      </nav>
    </div>
  </header>

  <!-- Hero -->
  <section class="hero">
    <div class="container hero-wrap">
      <div>
        <h1>Personaliza y exporta mapas de Bolivia en segundos</h1>
        <p>Colorea departamentos y provincias, ajusta etiquetas, atenúa el fondo y exporta en PNG o PDF. Todo desde tu navegador.</p>
        <div class="cta-row">
          <a class="btn btn-primary" href="/mapa-politico">Bolivia</a>
         
          <a class="btn btn-outline" href="/geodatos">Santa Cruz</a>
        </div>
      </div>
      <div class="hero-img">
        <!-- Reemplaza la ruta de la imagen con tu archivo en public/images -->
        <img src="/images/bolivia.png" alt="Mapa de Bolivia" style="max-width:100%; max-height:100%; object-fit:contain;" />
      </div>
    </div>
  </section>

  <!-- Features -->
  <section class="features container">
    <div class="grid">
      <div class="card"><h3>Colores por áreas</h3><p class="section-sub">Define colores por departamento o provincia y ajusta opacidad y bordes.</p></div>
      <div class="card"><h3>Etiquetas editables</h3><p class="section-sub">Cambia color, activa halo y arrastra las etiquetas a la posición ideal.</p></div>
      <div class="card"><h3>Exporta PNG / PDF</h3><p class="section-sub">Descarga tu mapa con un clic listo para informes o presentaciones.</p></div>
      <div class="card"><h3>Mundo atenuado</h3><p class="section-sub">Controla la “suavidad” del fondo para resaltar Bolivia.</p></div>
    </div>
  </section>

  <!-- Personaliza tu mapa -->
  <section id="personaliza">
    <div class="container">
      <h2 class="section-title">Personaliza tu mapa</h2>
      <p class="section-sub">Elige colores, ajusta etiquetas y exporta. La personalización ya está lista, ¡pruébala ahora!</p>
      <a class="btn btn-primary" href="/mapa-politico">Bolivia</a>
    </div>
  </section>

  <!-- Próximamente -->
  <section id="proximamente" style="background:var(--c-bg)">
    <div class="container">
      <h2 class="section-title">Próximamente</h2>
      <p class="section-sub">Muy pronto podrás ver opciones por Departamentos, Provincias y Municipios. Hoy ya está disponible el mapa político de Bolivia.</p>
      <div class="grid">
        <div class="card"><h3>Departamentos <span class="soon">Disponible</span></h3><p class="section-sub">Actívalo y personaliza por ADM1.</p></div>
        <div class="card"><h3>Provincias <span class="soon">En desarrollo</span></h3><p class="section-sub">ADM3 optimizado y filtros por departamento.</p></div>
        <div class="card"><h3>Municipios <span class="soon">Muy pronto</span></h3><p class="section-sub">Cobertura municipal con estilos avanzados.</p></div>
        <div class="card"><h3>Plantillas <span class="soon">Muy pronto</span></h3><p class="section-sub">Guarda y reutiliza combinaciones de colores.</p></div>
      </div>
    </div>
  </section>

  <!-- Acerca del autor -->
  <section id="autor">
    <div class="container">
      <h2 class="section-title">Acerca del autor</h2>
      <p class="section-sub">Proyecto desarrollado y Enfocado en brindar una herramienta simple y efectiva para crear mapas personalizados de Bolivia.</p>
      <div class="card" style="display:flex; align-items:center; gap:16px">
        <img src="/images/david.png" alt="Foto de David Flores" style="width:64px; height:64px; border-radius:12px; object-fit:cover; border:2px solid rgba(55,95,122,0.2);" />
        <div>
          <div style="font-weight:800; color:var(--c-secondary)">David Flores</div>
          <div class="section-sub">Apasionado por la tecnología y la educación.<a href="mailto:mapa@ite.com.bo" style="color:var(--c-secondary)">+59171039910</a></div>
          <div class="socials" style="margin-top:8px">
            <a href="https://www.facebook.com/ite.educabol" aria-label="Facebook" title="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 12C22 6.477 17.523 2 12 2S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.877v-6.987H7.898v-2.89h2.54V9.845c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.772-1.63 1.562v1.875h2.773l-.443 2.89h-2.33v6.987C18.343 21.128 22 16.991 22 12Z" fill="currentColor"/></svg>
            </a>
           
            <a href="https://www.youtube.com/@ite_educabol" aria-label="YouTube" title="YouTube">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M23.5 6.2s-.2-1.7-.9-2.5c-.8-.9-1.7-.9-2.1-1C17.6 2.4 12 2.4 12 2.4h0s-5.6 0-8.5.3c-.4.1-1.3.1-2.1 1C.7 4.5.5 6.2.5 6.2S.3 8.2.3 10.2v1.9c0 2 .2 4 .2 4s.2 1.7.9 2.5c.8.9 2 .9 2.6 1 1.9.2 8 .3 8 .3s5.6 0 8.5-.3c.4-.1 1.3-.1 2.1-1 .7-.8.9-2.5.9-2.5s.2-2 .2-4v-1.9c0-2-.2-4-.2-4ZM9.8 14.7V7.9l6.2 3.4-6.2 3.4Z" fill="currentColor"/></svg>
            </a>
            <a href="https://www.tiktok.com/@ite_educabol" aria-label="TikTok" title="TikTok">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.042 2h3.104c.132 1.09.73 2.115 1.64 2.77a5.8 5.8 0 0 0 2.731.928v3.13a9.014 9.014 0 0 1-4.2-1.19v5.94c0 3.2-2.591 5.8-5.79 5.8S3.75 16.779 3.75 13.58a5.79 5.79 0 0 1 7.89-5.41v3.24a2.66 2.66 0 0 0-3.78 2.46 2.66 2.66 0 0 0 2.66 2.66 2.66 2.66 0 0 0 2.66-2.66V2Z" fill="currentColor"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="footer">
    <div class="container" style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap">
      <div>© {{ date('Y') }} Mapas Bolivia · Todos los derechos reservados</div>
      <div class="socials">
        <a href="https://www.facebook.com/ite.educabol" aria-label="Facebook" title="Facebook">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 12C22 6.477 17.523 2 12 2S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.877v-6.987H7.898v-2.89h2.54V9.845c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.772-1.63 1.562v1.875h2.773l-.443 2.89h-2.33v6.987C18.343 21.128 22 16.991 22 12Z" fill="currentColor"/></svg>
        </a>
       
        <a href="https://www.youtube.com/@ite_educabol" aria-label="YouTube" title="YouTube">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M23.5 6.2s-.2-1.7-.9-2.5c-.8-.9-1.7-.9-2.1-1C17.6 2.4 12 2.4 12 2.4h0s-5.6 0-8.5.3c-.4.1-1.3.1-2.1 1C.7 4.5.5 6.2.5 6.2S.3 8.2.3 10.2v1.9c0 2 .2 4 .2 4s.2 1.7.9 2.5c.8.9 2 .9 2.6 1 1.9.2 8 .3 8 .3s5.6 0 8.5-.3c.4-.1 1.3-.1 2.1-1 .7-.8.9-2.5.9-2.5s.2-2 .2-4v-1.9c0-2-.2-4-.2-4ZM9.8 14.7V7.9l6.2 3.4-6.2 3.4Z" fill="currentColor"/></svg>
        </a>
        <a href="https://www.tiktok.com/@ite_educabol" aria-label="TikTok" title="TikTok">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.042 2h3.104c.132 1.09.73 2.115 1.64 2.77a5.8 5.8 0 0 0 2.731.928v3.13a9.014 9.014 0 0 1-4.2-1.19v5.94c0 3.2-2.591 5.8-5.79 5.8S3.75 16.779 3.75 13.58a5.79 5.79 0 0 1 7.89-5.41v3.24a2.66 2.66 0 0 0-3.78 2.46 2.66 2.66 0 0 0 2.66 2.66 2.66 2.66 0 0 0 2.66-2.66V2Z" fill="currentColor"/>
          </svg>
        </a>
      </div>
    </div>
  </footer>
</body>
</html>
