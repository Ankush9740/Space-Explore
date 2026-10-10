// Shared navigation, scroll effects and page interactions.
setupSiteIntro();

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
  setupJourneyVideo(reducedMotion.matches);
  setupPlanetGallery(reducedMotion.matches);
  setupGallery();
  setupContactForm();
});

function setupSiteIntro() {
  const intro = document.querySelector("[data-site-intro]");
  if (!intro) return;

  const root = document.documentElement;
  const sessionKey = "space-explorer-intro-seen";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let hasPlayed = false;

  try {
    hasPlayed = window.sessionStorage.getItem(sessionKey) === "true";
  } catch {
    // The intro can still run if storage is unavailable; the hidden fallback remains safe.
  }

  if (hasPlayed || reduceMotion) {
    if (reduceMotion) {
      try {
        window.sessionStorage.setItem(sessionKey, "true");
      } catch {
        // Storage may be disabled in privacy-focused browsing modes.
      }
    }
    intro.remove();
    return;
  }

  try {
    window.sessionStorage.setItem(sessionKey, "true");
  } catch {
    // Continue without persistence rather than blocking the page.
  }

  const scrollbarGap = Math.max(window.innerWidth - root.clientWidth, 0);
  root.style.setProperty("--intro-scrollbar-gap", `${scrollbarGap}px`);
  root.classList.add("site-intro-active", "site-intro-hold");
  intro.hidden = false;

  requestAnimationFrame(() => {
    intro.classList.add("is-visible");
  });

  let cleanedUp = false;
  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    root.classList.remove("site-intro-active", "site-intro-hold");
    root.style.removeProperty("--intro-scrollbar-gap");
    intro.remove();
  };

  window.setTimeout(() => {
    intro.classList.add("is-leaving");
    root.classList.remove("site-intro-hold");
  }, 1300);

  intro.addEventListener("transitionend", (event) => {
    if (event.target === intro && event.propertyName === "opacity" && intro.classList.contains("is-leaving")) {
      cleanup();
    }
  });

  // Backup cleanup keeps the page usable if a transition is interrupted.
  window.setTimeout(cleanup, 2200);
}

function setupJourneyVideo(reduceMotion) {
  const video = document.querySelector(".journey-cinema-video");
  if (!video) return;

  video.muted = true;

  if (reduceMotion) {
    video.pause();
    return;
  }

  const playbackObserver = new IntersectionObserver((entries) => {
    const isVisible = entries[0].isIntersecting;

    if (isVisible) {
      video.play().catch(() => {
        // The panel background keeps the section intentional if autoplay is blocked.
      });
    } else {
      video.pause();
    }
  }, { threshold: 0.25 });

  playbackObserver.observe(video);
}

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

  const section = stage.closest(".planet-gallery-section");
  const wrappers = [...stage.querySelectorAll(".planet-motion-wrapper")];
  const dragSurface = document.createElement("div");
  const mobileLayout = window.matchMedia("(max-width: 700px)");
  const rotations = [-5, 3.5, -1.5, 3, -3.5, 4.5, -2.5, 3.5];
  const yOffsets = [-34, 22, -10, 28, -26, 18, -30, 24];
  const scaleBias = [0.99, 1, 1.01, 0.99, 1.01, 1, 0.99, 1];

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
  let loopWidth = 0;
  let centerPosition = 0;
  let autoSpeed = -0.36;
  let initialized = false;
  let focusedIndex = -1;
  let snapTarget = null;
  let snapStrength = 0.14;
  let keyboardTargetIndex = null;
  let initialPosition = 0;
  let enteredOnce = false;
  let mobileScrollFrame = 0;
  let hoveredIndex = -1;
  const wrapperZIndexes = new Array(wrappers.length).fill(null);

  dragSurface.className = "planet-drag-surface";
  dragSurface.setAttribute("aria-hidden", "true");
  stage.append(dragSurface);

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

  const setFocusedCard = (index) => {
    if (index === focusedIndex) return;

    wrappers[focusedIndex]?.classList.remove("is-focused");
    wrappers[focusedIndex]?.querySelector(".planet-card")?.removeAttribute("aria-current");
    wrappers[index]?.classList.add("is-focused");
    wrappers[index]?.querySelector(".planet-card")?.setAttribute("aria-current", "true");
    focusedIndex = index;
  };

  const setHoveredCard = (index) => {
    if (index === hoveredIndex) return;
    wrappers[hoveredIndex]?.classList.remove("is-hovered");
    wrappers[index]?.classList.add("is-hovered");
    hoveredIndex = index;
  };

  const measure = () => {
    stageWidth = stage.clientWidth;
    cardWidth = wrappers[0]?.offsetWidth || 300;
    spacing = Math.max(cardWidth + 52, Math.min(410, stageWidth * 0.29));
    loopWidth = spacing * wrappers.length;
    centerPosition = stageWidth / 2 - cardWidth / 2;
    autoSpeed = mobileLayout.matches ? -0.2 : stageWidth < 1000 ? -0.28 : -0.36;

    if (!initialized) {
      position = centerPosition - spacing * 2;
      initialPosition = position;
      velocity = autoSpeed;
      initialized = true;
    } else if (focusedIndex >= 0) {
      position = centerPosition - focusedIndex * spacing;
      initialPosition = position;
      snapTarget = null;
      keyboardTargetIndex = null;
      velocity = autoSpeed;
    }
  };

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const wrap = (value, length) => ((value % length) + length) % length;
  const easeOut = (value) => 1 - Math.pow(1 - value, 3);

  const getCardX = (index, atPosition = position) => {
    const offsetFromCenter = index * spacing + atPosition - centerPosition;
    return centerPosition + wrap(offsetFromCenter + loopWidth / 2, loopWidth) - loopWidth / 2;
  };

  const render = (now) => {
    if (!inView || compact) {
      frame = 0;
      return;
    }

    const delta = lastFrame ? Math.min((now - lastFrame) / 16.67, 2) : 1;
    lastFrame = now;
    const elapsed = now - enteredAt;
    if (!dragging) {
      if (snapTarget !== null) {
        const distanceToTarget = snapTarget - position;
        position += distanceToTarget * Math.min(snapStrength * delta, 1);
        velocity = 0;

        if (Math.abs(distanceToTarget) < 0.35) {
          position = snapTarget;
          snapTarget = null;
          snapStrength = 0.14;
          keyboardTargetIndex = null;
          velocity = autoSpeed;
        }
      } else {
        position += velocity * delta;
        velocity += (autoSpeed - velocity) * Math.min(0.035 * delta, 1);

        // Keep the virtual coordinate numerically small without changing any
        // card's wrapped screen position.
        if (Math.abs(position - initialPosition) > loopWidth * 4) {
          position = initialPosition + wrap(position - initialPosition + loopWidth / 2, loopWidth) - loopWidth / 2;
        }
      }
    }

    let nextFocused = 0;
    let closestDistance = Infinity;
    const stageCenter = stageWidth / 2;
    const motionLean = clamp(velocity * 0.13, -2.1, 2.1);
    const compactDepth = mobileLayout.matches ? 0.58 : 1;

    wrappers.forEach((wrapper, index) => {
      const cardX = getCardX(index);
      const cardCenter = cardX + cardWidth / 2;
      const distance = Math.abs(cardCenter - stageCenter);
      const focus = clamp(1 - distance / (spacing * 1.55), 0, 1);
      const entryDelay = index * 75;
      const entry = easeOut(clamp((elapsed - entryDelay) / 760, 0, 1));
      const entryLift = (1 - entry) * 46;
      const baseRotation = rotations[index] * (1 - focus * 0.94) * compactDepth;
      const entryRotation = (index % 2 === 0 ? -3 : 3) * (1 - entry);
      const maxTilt = mobileLayout.matches ? 3.2 : 5.5;
      const perspectiveTilt = clamp((stageCenter - cardCenter) / stageCenter * maxTilt, -maxTilt, maxTilt);
      const depth = (-92 + focus * 102) * compactDepth - (1 - entry) * 34;
      const scale = (0.86 + focus * 0.17) * (1 + (scaleBias[index] - 1) * (1 - focus * 0.7));
      const opacity = entry * (0.68 + focus * 0.32);

      const verticalOffset = yOffsets[index] * compactDepth + entryLift;
      wrapper.style.transform = `translate3d(${cardX.toFixed(2)}px, calc(-50% + ${verticalOffset.toFixed(2)}px), ${depth.toFixed(2)}px) rotateY(${perspectiveTilt.toFixed(2)}deg) rotateZ(${(baseRotation + entryRotation + motionLean).toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      wrapper.style.opacity = opacity.toFixed(3);
      const zIndex = 1 + Math.round(focus * 12);
      if (wrapperZIndexes[index] !== zIndex) {
        wrapper.style.zIndex = `${zIndex}`;
        wrapperZIndexes[index] = zIndex;
      }

      if (distance < closestDistance) {
        closestDistance = distance;
        nextFocused = index;
      }
    });

    setFocusedCard(nextFocused);

    if (section) {
      const orbitPhase = (position - initialPosition) / loopWidth * Math.PI * 2;
      section.style.setProperty("--planet-parallax", `${(Math.sin(orbitPhase) * 72).toFixed(2)}px`);
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
    const nextCompact = reduceMotion;
    if (nextCompact === compact && initialized) {
      if (!compact) {
        measure();
        start();
      }
      return;
    }

    compact = nextCompact;
    stage.classList.toggle("is-scroll", compact);

    if (compact) {
      cancelAnimationFrame(frame);
      frame = 0;
      clearDesktopStyles();
      section?.style.removeProperty("--planet-parallax");
      cardWidth = wrappers[0]?.offsetWidth || 300;
      if (reduceMotion || enteredOnce) stage.classList.add("is-entered");
    } else {
      measure();
      stage.classList.toggle("is-entered", enteredOnce);
      if (inView) start();
    }
  };

  stage.addEventListener("pointerdown", (event) => {
    if (compact || event.button !== 0) return;
    setHoveredCard(-1);
    pointerActive = true;
    dragging = false;
    pointerStartX = event.clientX;
    lastPointerX = event.clientX;
    lastPointerTime = performance.now();
    snapTarget = null;
    keyboardTargetIndex = null;
    snapStrength = 0.14;
    velocity = 0;
    stage.setPointerCapture(event.pointerId);
    start();
  });

  const handlePointerMove = (event) => {
    if (!pointerActive || compact) return;
    const now = performance.now();
    const movement = event.clientX - lastPointerX;
    const elapsed = Math.max(now - lastPointerTime, 8);

    if (!dragging && Math.abs(event.clientX - pointerStartX) >= 6) {
      dragging = true;
      velocity = 0;
      stage.classList.add("is-dragging");
    }

    if (dragging) {
      position += movement;
      velocity = clamp(movement / elapsed * 16.67, -18, 18);
      start();
    }

    lastPointerX = event.clientX;
    lastPointerTime = now;
  };

  dragSurface.addEventListener("pointermove", (event) => {
    if (compact || pointerActive) return;

    let nextHovered = -1;
    let nearestDistance = Infinity;

    wrappers.forEach((wrapper, index) => {
      const rect = wrapper.getBoundingClientRect();
      const insideCard = event.clientX >= rect.left && event.clientX <= rect.right
        && event.clientY >= rect.top && event.clientY <= rect.bottom;
      const distance = Math.abs(event.clientX - (rect.left + rect.width / 2));

      if (insideCard && distance < nearestDistance) {
        nearestDistance = distance;
        nextHovered = index;
      }
    });

    setHoveredCard(nextHovered);
  });

  dragSurface.addEventListener("pointerleave", () => setHoveredCard(-1));

  const release = (event) => {
    if (!pointerActive) return;
    pointerActive = false;
    const wasDragging = dragging;
    dragging = false;
    stage.classList.remove("is-dragging");
    setHoveredCard(-1);
    if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);

    if (!wasDragging) velocity = autoSpeed;
    start();
  };

  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", release);
  window.addEventListener("pointercancel", release);
  stage.addEventListener("dragstart", (event) => event.preventDefault());

  stage.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();

    if (compact) {
      const step = (wrappers[0]?.offsetWidth || cardWidth || 300) + 20;
      stage.scrollBy({
        left: event.key === "ArrowRight" ? step : -step,
        behavior: reduceMotion ? "auto" : "smooth"
      });
    } else {
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const pendingIndex = keyboardTargetIndex ?? focusedIndex;
      const nextIndex = wrap(pendingIndex + direction, wrappers.length);
      const basePosition = snapTarget ?? position;
      let travel = centerPosition - getCardX(nextIndex, basePosition);

      if (direction > 0 && travel > 0) travel -= loopWidth;
      if (direction < 0 && travel < 0) travel += loopWidth;

      velocity = 0;
      snapTarget = basePosition + travel;
      keyboardTargetIndex = nextIndex;
      snapStrength = 0.22;
      cancelAnimationFrame(frame);
      frame = 0;
      start();
    }
  });

  const updateMobileFocus = () => {
    mobileScrollFrame = 0;
    if (!compact) return;

    const stageRect = stage.getBoundingClientRect();
    const stageCenter = stageRect.left + stageRect.width / 2;
    let nextFocused = 0;
    let closestDistance = Infinity;

    wrappers.forEach((wrapper, index) => {
      const rect = wrapper.getBoundingClientRect();
      const distance = Math.abs(rect.left + rect.width / 2 - stageCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        nextFocused = index;
      }
    });

    setFocusedCard(nextFocused);
  };

  stage.addEventListener("scroll", () => {
    if (!mobileScrollFrame) mobileScrollFrame = requestAnimationFrame(updateMobileFocus);
  }, { passive: true });

  const sectionObserver = new IntersectionObserver((entries) => {
    const entry = entries[0];
    inView = entry.isIntersecting;

    if (inView && !enteredOnce) {
      enteredOnce = true;
      enteredAt = performance.now();
      stage.classList.add("is-entered");
    }

    if (inView) {
      if (compact) updateMobileFocus();
      else start();
    }
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
