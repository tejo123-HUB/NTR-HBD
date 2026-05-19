/* Jr. NTR Birthday Fan Site — Tejo Ravi Ram */
(function () {
  "use strict";

  gsap.registerPlugin(ScrollTrigger);

  function initThree() {
    const canvas = document.getElementById("bg-canvas");
    if (!canvas || typeof THREE === "undefined") return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 50;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const count = window.innerWidth < 768 ? 1200 : 2500;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const gold = new THREE.Color(0xd4af37);
    const crimson = new THREE.Color(0xc41e3a);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 120;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 120;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
      const mix = Math.random() > 0.7 ? gold : crimson;
      colors[i * 3] = mix.r;
      colors[i * 3 + 1] = mix.g;
      colors[i * 3 + 2] = mix.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.35,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const particleMesh = new THREE.Points(geometry, material);
    scene.add(particleMesh);
    let mouseX = 0;
    let mouseY = 0;

    document.addEventListener("mousemove", (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    function animate() {
      requestAnimationFrame(animate);
      particleMesh.rotation.y += 0.0004;
      particleMesh.rotation.x += 0.00015;
      camera.position.x += (mouseX * 8 - camera.position.x) * 0.02;
      camera.position.y += (-mouseY * 6 - camera.position.y) * 0.02;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  function movieMatchesFilter(movie, filter) {
    if (filter === "all") return true;
    if (filter === "blockbuster") return movie.tags.includes("blockbuster");
    if (filter === "rajamouli") return movie.tags.includes("rajamouli");
    if (filter === "recent") return movie.tags.includes("recent");
    return true;
  }

  function renderFilms() {
    const grid = document.getElementById("films-grid");
    if (!grid || typeof MOVIES === "undefined") return;
    grid.innerHTML = "";

    MOVIES.forEach((movie, index) => {
      const card = document.createElement("article");
      card.className = "film-card";
      card.dataset.index = String(index);
      card.style.transitionDelay = `${(index % 12) * 0.04}s`;

      const badge = movie.upcoming
        ? '<span class="film-badge upcoming">Soon</span>'
        : movie.tags.includes("rajamouli")
          ? '<span class="film-badge rajamouli">Rajamouli</span>'
          : movie.tags.includes("blockbuster")
            ? '<span class="film-badge blockbuster">Hit</span>'
            : "";

      const initial = movie.title.replace(/[^a-zA-Z]/g, "").charAt(0) || "N";

      let posterInner = `
        <div class="film-poster-fallback">
          <span class="initial">${initial}</span>
          <span class="title-fb">${movie.title}</span>
        </div>`;

      if (movie.poster) {
        posterInner = `
          <img class="film-poster" src="${movie.poster}" alt="${movie.title} (${movie.year})" loading="lazy" />
          <div class="film-poster-fallback" hidden>
            <span class="initial">${initial}</span>
            <span class="title-fb">${movie.title}</span>
          </div>`;
      }

      card.innerHTML = `
        ${badge}
        <div class="film-card-inner">
          ${posterInner}
          <div class="film-overlay">
            <span class="film-year">${movie.year}</span>
            <h3 class="film-title">${movie.title}</h3>
            <p class="film-role">${movie.role}</p>
            <p class="film-director">Dir. ${movie.director}</p>
            ${movie.note ? `<p class="film-note">${movie.note}</p>` : ""}
          </div>
        </div>
        <div class="film-meta-bar">
          <p class="film-title-sm">${movie.title}</p>
          <p class="film-year-sm">${movie.year}</p>
        </div>
      `;

      const img = card.querySelector(".film-poster");
      const fallback = card.querySelector(".film-poster-fallback");
      if (img && fallback) {
        img.addEventListener("error", () => {
          img.remove();
          fallback.hidden = false;
        });
      }

      grid.appendChild(card);
    });

    observeFilmCards();
  }

  function observeFilmCards() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".film-card:not(.hidden-filter)").forEach((c) => observer.observe(c));
  }

  function applyFilter(filter) {
    document.querySelectorAll(".film-card").forEach((card) => {
      const movie = MOVIES[parseInt(card.dataset.index, 10)];
      const show = movieMatchesFilter(movie, filter);
      card.classList.toggle("hidden-filter", !show);
      if (show) card.classList.add("visible");
    });
    observeFilmCards();
  }

  function initFilters() {
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        applyFilter(btn.dataset.filter);
      });
    });
  }

  function initScrollAnimations() {
    gsap.utils.toArray("[data-reveal]").forEach((el) => {
      gsap.to(el, {
        scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none reverse" },
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: "power3.out",
      });
    });

    gsap.to(".hero-portrait-wrap", {
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 },
      y: 120,
      rotateY: -15,
      scale: 0.92,
    });

    gsap.to(".hero-orbit", {
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 },
      rotateZ: 25,
    });

    gsap.utils.toArray(".glass-card").forEach((card, i) => {
      gsap.to(card, {
        scrollTrigger: { trigger: ".about-cards", start: "top 70%", end: "bottom 30%", scrub: 1 },
        y: (i - 1) * -40,
        x: i % 2 === 0 ? 20 : -20,
      });
    });
  }

  function initCounters() {
    document.querySelectorAll("[data-count]").forEach((el) => {
      const target = parseInt(el.dataset.count, 10);
      ScrollTrigger.create({
        trigger: el,
        start: "top 85%",
        once: true,
        onEnter: () => {
          gsap.to(
            { val: 0 },
            {
              val: target,
              duration: 2,
              ease: "power2.out",
              onUpdate: function () {
                el.textContent = Math.floor(this.targets()[0].val);
              },
            }
          );
        },
      });
    });
  }

  function initQuotes() {
    const quotes = document.querySelectorAll(".quote");
    const dotsContainer = document.getElementById("quote-dots");
    if (!quotes.length || !dotsContainer) return;

    quotes.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.className = `quote-dot${i === 0 ? " active" : ""}`;
      dot.setAttribute("aria-label", `Quote ${i + 1}`);
      dot.addEventListener("click", () => goToQuote(i));
      dotsContainer.appendChild(dot);
    });

    let current = 0;
    function goToQuote(index) {
      quotes[current].classList.remove("active");
      dotsContainer.children[current].classList.remove("active");
      current = index;
      quotes[current].classList.add("active");
      dotsContainer.children[current].classList.add("active");
    }

    setInterval(() => {
      goToQuote((current + 1) % quotes.length);
    }, 5000);
  }

  function initConfetti() {
    const container = document.getElementById("confetti");
    if (!container) return;
    const colors = ["#d4af37", "#c41e3a", "#ff6b35", "#f4f0e8"];

    ScrollTrigger.create({
      trigger: "#tribute",
      start: "top 60%",
      once: true,
      onEnter: () => {
        for (let i = 0; i < 80; i++) {
          const piece = document.createElement("div");
          piece.className = "confetti-piece";
          piece.style.left = `${Math.random() * 100}%`;
          piece.style.background = colors[Math.floor(Math.random() * colors.length)];
          piece.style.animationDuration = `${2 + Math.random() * 3}s`;
          piece.style.animationDelay = `${Math.random() * 0.5}s`;
          piece.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
          const size = 4 + Math.random() * 8;
          piece.style.width = `${size}px`;
          piece.style.height = `${size}px`;
          container.appendChild(piece);
        }
      },
    });
  }

  function initNav() {
    const nav = document.getElementById("nav");
    const toggle = document.getElementById("nav-toggle");
    const links = document.querySelector(".nav-links");

    window.addEventListener("scroll", () => {
      nav.classList.toggle("scrolled", window.scrollY > 60);
    });

    toggle?.addEventListener("click", () => links.classList.toggle("open"));
    links?.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => links.classList.remove("open"));
    });
  }

  function initHeroTilt() {
    const orbit = document.getElementById("hero-orbit");
    if (!orbit || window.matchMedia("(max-width: 1024px)").matches) return;

    document.addEventListener("mousemove", (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 16;
      const y = (e.clientY / window.innerHeight - 0.5) * 16;
      gsap.to(orbit, { rotateY: x, rotateX: -y, duration: 0.6, ease: "power2.out" });
    });
  }

  function initLoader() {
    const loader = document.getElementById("loader");
    window.addEventListener("load", () => {
      setTimeout(() => {
        loader?.classList.add("hidden");
        gsap.from(".hero-title .line", {
          y: 100,
          opacity: 0,
          stagger: 0.15,
          duration: 1,
          ease: "power4.out",
          delay: 0.2,
        });
        gsap.from(".hero-portrait-wrap", {
          scale: 0.8,
          opacity: 0,
          duration: 1.2,
          ease: "power3.out",
          delay: 0.4,
        });
      }, 1200);
    });
  }

  initThree();
  initLoader();
  initNav();
  initScrollAnimations();
  initCounters();
  initQuotes();
  initConfetti();
  initHeroTilt();
  renderFilms();
  initFilters();
})();
