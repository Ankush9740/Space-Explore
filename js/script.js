// Shared navigation, scroll effects and page interactions.
document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".site-header");
  const menuButton = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");
  const scrollButton = document.querySelector(".scroll-top");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  menuButton?.addEventListener("click", () => {
    const isOpen = menuButton.classList.toggle("open");
    navLinks.classList.toggle("open", isOpen);
    menuButton.setAttribute("aria-expanded", isOpen);
  });

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      menuButton?.classList.remove("open");
      navLinks?.classList.remove("open");
      menuButton?.setAttribute("aria-expanded", "false");
    });
  });

  const handleScroll = () => {
    const hasScrolled = window.scrollY > 30;
    header?.classList.toggle("scrolled", hasScrolled);
    scrollButton?.classList.toggle("show", window.scrollY > 500);
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();

  scrollButton?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  const revealItems = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.13 }
  );

  revealItems.forEach((item) => observer.observe(item));

  setupHomeHeroMotion(reducedMotion.matches);
  setupPlanetGallery(reducedMotion.matches);
  setupGallery();
  setupContactForm();
});

function setupHomeHeroMotion(reduceMotion) {
  const hero = document.querySelector(".page-home .hero");
  if (!hero || reduceMotion) return;

  const pointerParallax = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 900px)");
  const current = { x: 0, y: 0, scroll: 0 };
  const target = { x: 0, y: 0, scroll: 0 };
  const bounds = { left: 0, top: 0, width: 1, height: 1 };
  let frame = 0;

  const measureHero = () => {
    const rect = hero.getBoundingClientRect();
    bounds.left = rect.left + window.scrollX;
    bounds.top = rect.top + window.scrollY;
    bounds.width = Math.max(rect.width, 1);
    bounds.height = Math.max(rect.height, 1);
  };

  const draw = () => {
    current.x += (target.x - current.x) * 0.065;
    current.y += (target.y - current.y) * 0.065;
    current.scroll += (target.scroll - current.scroll) * 0.1;

    hero.style.setProperty("--hero-media-x", `${(-current.x * 3).toFixed(2)}px`);
    hero.style.setProperty("--hero-media-y", `${(-current.y * 2 - current.scroll * 10).toFixed(2)}px`);
    hero.style.setProperty("--hero-star-x", `${(current.x * 5.5).toFixed(2)}px`);
    hero.style.setProperty("--hero-star-y", `${(current.y * 4 - current.scroll * 15).toFixed(2)}px`);
    hero.style.setProperty("--hero-astronaut-x", `${(current.x * 9).toFixed(2)}px`);
    hero.style.setProperty("--hero-astronaut-y", `${(current.y * 7 - current.scroll * 12).toFixed(2)}px`);
    hero.style.setProperty("--hero-content-y", `${(-current.scroll * 32).toFixed(2)}px`);
    hero.style.setProperty("--hero-content-opacity", (1 - current.scroll * 0.26).toFixed(3));

    const moving =
      Math.abs(target.x - current.x) > 0.002 ||
      Math.abs(target.y - current.y) > 0.002 ||
      Math.abs(target.scroll - current.scroll) > 0.002;

    frame = moving ? requestAnimationFrame(draw) : 0;
  };

  const requestDraw = () => {
    if (!frame) frame = requestAnimationFrame(draw);
  };

  hero.addEventListener("pointermove", (event) => {
    if (!pointerParallax.matches) return;
    const x = (event.clientX + window.scrollX - bounds.left) / bounds.width;
    const y = (event.clientY + window.scrollY - bounds.top) / bounds.height;
    target.x = Math.min(Math.max((x - 0.5) * 2, -1), 1);
    target.y = Math.min(Math.max((y - 0.5) * 2, -1), 1);
    requestDraw();
  }, { passive: true });

  hero.addEventListener("pointerleave", () => {
    target.x = 0;
    target.y = 0;
    requestDraw();
  });

  pointerParallax.addEventListener?.("change", () => {
    if (pointerParallax.matches) return;
    target.x = 0;
    target.y = 0;
    requestDraw();
  });

  const updateScroll = () => {
    target.scroll = Math.min(window.scrollY / bounds.height, 1);
    requestDraw();
  };

  window.addEventListener("resize", measureHero, { passive: true });
  window.addEventListener("scroll", updateScroll, { passive: true });
  measureHero();
  updateScroll();
}

function setupPlanetGallery(reduceMotion) {
  const stage = document.querySelector(".planet-stage");
  if (!stage) return;

  const wrappers = [...stage.querySelectorAll(".planet-motion-wrapper")];
  const mobileLayout = window.matchMedia("(max-width: 700px)");
  const rotations = [-5, 3, -1, -3, 2.5, 4, -2, 3];
  const yOffsets = [-62, 34, -12, 66, -38, 44, -54, 58];
  const emphasis = [0.98, 0.99, 1.045, 0.99, 1.035, 1, 0.98, 0.99];

  let compact = false;
  let inView = false;
  let pointerActive = false;
  let dragging = false;
  let frame = 0;
  let lastFrame = 0;
  let enteredAt = 0;
  let position = 0;
  let velocity = 0;
  let pointerStartX = 0;
  let lastPointerX = 0;
  let lastPointerTime = 0;
  let stageWidth = 0;
  let cardWidth = 0;
  let spacing = 360;
  let loopWidth = spacing * wrappers.length;
  let initialized = false;
  let focusedIndex = -1;
  const wrapperZIndexes = new Array(wrappers.length).fill(null);

  wrappers.forEach((wrapper, index) => {
    wrapper.style.setProperty("--mobile-rotation", reduceMotion ? "0deg" : `${(rotations[index] * 0.32).toFixed(2)}deg`);
  });

  const clearDesktopStyles = () => {
    wrappers.forEach((wrapper, index) => {
      wrapper.style.removeProperty("transform");
      wrapper.style.removeProperty("opacity");
      wrapper.style.removeProperty("z-index");
      wrapperZIndexes[index] = null;
      wrapper.classList.remove("is-focused");
    });
    focusedIndex = -1;
  };

  const measure = () => {
    stageWidth = stage.clientWidth;
    cardWidth = wrappers[0]?.offsetWidth || 300;
    spacing = Math.max(cardWidth + 48, Math.min(400, stageWidth * 0.28));
    loopWidth = spacing * wrappers.length;

    if (!initialized) {
      position = stageWidth / 2 - cardWidth / 2 - spacing * 2;
      initialized = true;
    }
  };

  const wrap = (value, length) => ((value % length) + length) % length;
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const easeOut = (value) => 1 - Math.pow(1 - value, 3);

  const render = (now) => {
    if (!inView || compact) {
      frame = 0;
      return;
    }

    const delta = lastFrame ? Math.min((now - lastFrame) / 16.67, 2) : 1;
    lastFrame = now;
    const elapsed = now - enteredAt;
    const driftStrength = clamp((elapsed - 900) / 1000, 0, 1);

    if (!dragging) {
      if (Math.abs(velocity) > 0.018) {
        position += velocity * delta;
        velocity *= Math.pow(0.925, delta);
      } else {
        velocity = 0;
        position -= 0.22 * driftStrength * delta;
      }
    }

    let nextFocused = 0;
    let closestDistance = Infinity;

    wrappers.forEach((wrapper, index) => {
      const wrappedX = wrap(index * spacing + position + spacing, loopWidth) - spacing;
      const cardCenter = wrappedX + cardWidth / 2;
      const distance = Math.abs(cardCenter - stageWidth / 2);
      const focus = clamp(1 - distance / (stageWidth * 0.58), 0, 1);
      const entryDelay = index * 70;
      const entry = easeOut(clamp((elapsed - entryDelay) / 620, 0, 1));
      const entryShift = (index % 2 === 0 ? -1 : 1) * (1 - entry) * 95;
      const baseRotation = rotations[index] * (1 - focus * 0.88);
      const entryRotation = (index % 2 === 0 ? -4 : 4) * (1 - entry);
      const tilt = clamp((stageWidth / 2 - cardCenter) / (stageWidth / 2) * 5, -5, 5);
      const scale = emphasis[index] * (0.9 + focus * 0.1);
      const opacity = entry * (0.58 + focus * 0.42);

      wrapper.style.transform = `translate3d(${(wrappedX + entryShift).toFixed(2)}px, calc(-50% + ${yOffsets[index]}px), 0) rotateY(${tilt.toFixed(2)}deg) rotateZ(${(baseRotation + entryRotation).toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      wrapper.style.opacity = opacity.toFixed(3);
      const zIndex = 1 + Math.round(focus * 9);
      if (wrapperZIndexes[index] !== zIndex) {
        wrapper.style.zIndex = `${zIndex}`;
        wrapperZIndexes[index] = zIndex;
      }

      if (distance < closestDistance) {
        closestDistance = distance;
        nextFocused = index;
      }
    });

    if (nextFocused !== focusedIndex) {
      wrappers[focusedIndex]?.classList.remove("is-focused");
      wrappers[nextFocused]?.classList.add("is-focused");
      focusedIndex = nextFocused;
    }

    frame = requestAnimationFrame(render);
  };

  const start = () => {
    if (!frame && inView && !compact) {
      lastFrame = 0;
      frame = requestAnimationFrame(render);
    }
  };

  const setLayout = () => {
    const nextCompact = reduceMotion || mobileLayout.matches;
    if (nextCompact === compact && initialized) {
      if (!compact) measure();
      return;
    }

    compact = nextCompact;
    stage.classList.toggle("is-scroll", compact);

    if (compact) {
      cancelAnimationFrame(frame);
      frame = 0;
      clearDesktopStyles();
      cardWidth = wrappers[0]?.offsetWidth || 300;
      if (reduceMotion || inView) stage.classList.add("is-entered");
    } else {
      stage.classList.remove("is-entered");
      measure();
      if (inView) {
        enteredAt = performance.now();
        stage.classList.add("is-entered");
        start();
      }
    }
  };

  stage.addEventListener("pointerdown", (event) => {
    if (compact || event.button !== 0) return;
    pointerActive = true;
    pointerStartX = event.clientX;
    lastPointerX = event.clientX;
    lastPointerTime = performance.now();
    event.preventDefault();
  });

  stage.addEventListener("pointermove", (event) => {
    if (!pointerActive || compact) return;
    const now = performance.now();
    const movement = event.clientX - lastPointerX;
    const elapsed = Math.max(now - lastPointerTime, 8);

    if (!dragging && Math.abs(event.clientX - pointerStartX) >= 6) {
      dragging = true;
      velocity = 0;
      stage.classList.add("is-dragging");
      stage.setPointerCapture(event.pointerId);
    }

    if (dragging) {
      position += movement;
      velocity = movement / elapsed * 16.67;
    }

    lastPointerX = event.clientX;
    lastPointerTime = now;
  });

  const release = (event) => {
    if (!pointerActive) return;
    pointerActive = false;
    dragging = false;
    stage.classList.remove("is-dragging");
    if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
  };

  stage.addEventListener("pointerup", release);
  stage.addEventListener("pointercancel", release);

  stage.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const direction = event.key === "ArrowLeft" ? 1 : -1;

    if (compact) {
      const step = (wrappers[0]?.offsetWidth || cardWidth || 300) + 20;
      stage.scrollLeft += event.key === "ArrowRight" ? step : -step;
    } else {
      velocity = direction * 8;
    }
  });

  const sectionObserver = new IntersectionObserver((entries) => {
    const entry = entries[0];
    inView = entry.isIntersecting;

    if (inView && !stage.classList.contains("is-entered")) {
      enteredAt = performance.now();
      stage.classList.add("is-entered");
    }

    if (inView) start();
    else {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }, { threshold: 0.08 });

  let resizeFrame = 0;
  window.addEventListener("resize", () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(setLayout);
  }, { passive: true });

  mobileLayout.addEventListener?.("change", setLayout);
  setLayout();
  sectionObserver.observe(stage);
}

function setupGallery() {
  const lightbox = document.querySelector(".lightbox");
  if (!lightbox) return;

  const lightboxImage = lightbox.querySelector("img");
  const closeButton = lightbox.querySelector(".lightbox-close");

  document.querySelectorAll(".gallery-item").forEach((item) => {
    item.addEventListener("click", () => {
      const image = item.querySelector("img");
      lightboxImage.src = image.src;
      lightboxImage.alt = image.alt;
      lightbox.classList.add("open");
      lightbox.setAttribute("aria-hidden", "false");
      closeButton.focus();
    });

    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        item.click();
      }
    });
  });

  const closeLightbox = () => {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
  };

  closeButton.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeLightbox();
  });
}

function setupContactForm() {
  const form = document.querySelector("#contact-form");
  if (!form) return;

  const status = form.querySelector(".form-status");
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const requiredFields = form.querySelectorAll("[required]");
    let isValid = true;

    requiredFields.forEach((field) => {
      const invalidEmail = field.type === "email" && !emailPattern.test(field.value.trim());
      const isEmpty = !field.value.trim();
      field.classList.toggle("invalid", isEmpty || invalidEmail);
      if (isEmpty || invalidEmail) isValid = false;
    });

    if (!isValid) {
      status.textContent = "Please complete every field with a valid email address.";
      return;
    }

    status.textContent = "Message received! Your journey with us starts here.";
    form.reset();
  });

  form.querySelectorAll("input, textarea").forEach((field) => {
    field.addEventListener("input", () => field.classList.remove("invalid"));
  });
}
