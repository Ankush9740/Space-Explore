// Shared navigation, scroll effects and page interactions.
setupSiteIntro();

document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".site-header");
  const menuButton = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");
  const scrollButton = document.querySelector(".scroll-top");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const journeyMotion = setupJourneyScroll(reducedMotion.matches);

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
    journeyMotion?.requestUpdate();
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

function setupJourneyScroll(reduceMotion) {
  const journey = document.querySelector("[data-journey]");
  if (!journey) return null;

  const opening = journey.querySelector("[data-journey-opening]");
  const cosmos = journey.querySelector("[data-cosmos-story]");
  const questions = journey.querySelector("[data-questions-story]");
  const unknown = journey.querySelector("[data-unknown-story]");
  const closing = journey.querySelector("[data-journey-closing]");
  const cosmosWords = [...journey.querySelectorAll(".cosmos-word")];
  const unknownWords = [...journey.querySelectorAll(".unknown-word")];
  const unknownStatements = [...journey.querySelectorAll(".unknown-statement")];
  const asteroids = [...journey.querySelectorAll(".asteroid")];
  const closingWords = [...journey.querySelectorAll(".closing-word")];
  const questionPanels = [...journey.querySelectorAll("[data-question-panel]")];

  if (reduceMotion) {
    journey.classList.add("is-reduced");
    return null;
  }

  const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);
  const smooth = (value) => value * value * (3 - 2 * value);
  const range = (progress, start, end) => smooth(clamp((progress - start) / (end - start)));
  const sections = [opening, cosmos, questions, unknown, closing].filter(Boolean);
  const bounds = new Map();
  const visibleSections = new Set();
  const asteroidMotion = [
    { x: 310, y: 150, startScale: 0.3, endScale: 1.5, rotation: 58, enter: 0.05, exit: 0.7 },
    { x: -210, y: 175, startScale: 0.42, endScale: 1.18, rotation: -72, enter: 0.12, exit: 0.82 },
    { x: 260, y: -180, startScale: 0.34, endScale: 1.3, rotation: 84, enter: 0.2, exit: 0.88 },
    { x: -360, y: -160, startScale: 0.28, endScale: 1.65, rotation: -52, enter: 0.02, exit: 0.66 },
    { x: 115, y: 210, startScale: 0.48, endScale: 1.05, rotation: 96, enter: 0.28, exit: 0.94 },
    { x: -145, y: -205, startScale: 0.4, endScale: 1.18, rotation: -88, enter: 0.22, exit: 0.96 },
    { x: -90, y: 80, startScale: 0.52, endScale: 1.08, rotation: 48, enter: 0.38, exit: 0.92 },
  ];
  let viewportWidth = document.documentElement.clientWidth;
  let frame = 0;
  let resizeFrame = 0;

  const measure = () => {
    viewportWidth = document.documentElement.clientWidth;
    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      bounds.set(section, {
        top: rect.top + window.scrollY,
        distance: Math.max(section.offsetHeight - window.innerHeight, 1),
      });
    });
  };

  const progressFor = (section) => {
    const sectionBounds = bounds.get(section);
    return sectionBounds
      ? clamp((window.scrollY - sectionBounds.top) / sectionBounds.distance)
      : 0;
  };

  const renderOpening = () => {
    const progress = progressFor(opening);
    const intro = range(progress, -0.12, 0.08);
    const exit = 1 - range(progress, 0.76, 0.98);
    const reveal = range(progress, 0.18, 0.7);
    const settle = range(progress, 0.1, 0.62);
    const lift = range(progress, 0.72, 0.96);

    opening.style.setProperty("--opening-intro-alpha", (intro * exit).toFixed(4));
    opening.style.setProperty("--opening-title-alpha", (intro * exit).toFixed(4));
    opening.style.setProperty("--opening-title-y", `${(40 * (1 - intro) - 18 * lift).toFixed(2)}px`);
    opening.style.setProperty("--opening-title-scale", (0.97 + settle * 0.05 - lift * 0.06).toFixed(4));
    opening.style.setProperty("--opening-wipe", `${((1 - reveal) * 100).toFixed(2)}%`);
    opening.style.setProperty("--opening-copy-alpha", (range(progress, 0.3, 0.52) * exit).toFixed(4));
    opening.style.setProperty("--opening-copy-y", `${(16 * (1 - range(progress, 0.3, 0.52))).toFixed(2)}px`);
    opening.style.setProperty("--opening-cue-alpha", (1 - range(progress, 0.06, 0.32)).toFixed(4));
    opening.style.setProperty("--opening-horizon-alpha", (0.12 + range(progress, 0.22, 0.92) * 0.4).toFixed(4));
    opening.style.setProperty("--horizon-y", `${(-18 * progress).toFixed(2)}px`);
    opening.style.setProperty("--star-far-y", `${(-18 * progress).toFixed(2)}px`);
    opening.style.setProperty("--star-near-y", `${(-34 * progress).toFixed(2)}px`);
    opening.style.setProperty("--space-scale", (1 + progress * 0.02).toFixed(4));
  };

  const renderCosmos = () => {
    const progress = progressFor(cosmos);
    const departure = range(progress, 0.35, 0.65);
    const earthFade = 1 - range(progress, 0.38, 0.68);
    const spaceReveal = range(progress, 0.28, 0.74);
    const mobileMotion = viewportWidth <= 580 ? 0.62 : viewportWidth <= 820 ? 0.8 : 1;

    cosmos.style.setProperty("--cosmos-label-alpha", (0.82 * (1 - range(progress, 0.5, 0.65))).toFixed(4));
    cosmos.style.setProperty("--cosmos-galaxy-alpha", (0.18 + spaceReveal * 0.54).toFixed(4));
    cosmos.style.setProperty("--cosmos-galaxy-y", `${((18 - progress * 42) * mobileMotion).toFixed(2)}px`);
    cosmos.style.setProperty("--cosmos-galaxy-scale", (1.08 - progress * 0.055).toFixed(4));
    cosmos.style.setProperty("--cosmos-earth-alpha", (0.94 * earthFade).toFixed(4));
    cosmos.style.setProperty("--cosmos-earth-x", `${(-120 * departure * mobileMotion).toFixed(2)}px`);
    cosmos.style.setProperty("--cosmos-earth-y", `${((-6 * range(progress, 0, 0.35) - 20 * departure) * mobileMotion).toFixed(2)}px`);
    cosmos.style.setProperty("--cosmos-earth-scale", (1 - departure * 0.48).toFixed(4));
    cosmos.style.setProperty("--cosmos-earth-rotation", `${(-2.2 * departure).toFixed(3)}deg`);
    cosmos.style.setProperty("--cosmos-stars-far-alpha", (0.18 + spaceReveal * 0.46).toFixed(4));
    cosmos.style.setProperty("--cosmos-stars-near-alpha", (0.1 + spaceReveal * 0.38).toFixed(4));
    cosmos.style.setProperty("--star-far-y", `${(-22 * progress).toFixed(2)}px`);
    cosmos.style.setProperty("--star-near-y", `${(-46 * progress).toFixed(2)}px`);
    cosmos.style.setProperty("--space-scale", (1 + progress * 0.035).toFixed(4));
    const copyProgress = range(progress, 0.87, 0.97);
    cosmos.style.setProperty("--cosmos-copy-alpha", copyProgress.toFixed(4));
    cosmos.style.setProperty("--cosmos-copy-y", `${(18 * (1 - copyProgress)).toFixed(2)}px`);

    cosmosWords.forEach((word, index) => {
      const wordProgress = range(progress, 0.65 + index * 0.024, 0.76 + index * 0.024);
      word.style.setProperty("--word-alpha", wordProgress.toFixed(4));
      word.style.setProperty("--word-y", `${(28 * (1 - wordProgress)).toFixed(2)}px`);
    });
  };

  const renderUnknown = () => {
    const progress = progressFor(unknown);
    const introIn = range(progress, -0.12, 0.04);
    const introOut = 1 - range(progress, 0.34, 0.42);
    const fieldStrength = range(progress, 0.02, 0.7) * (1 - range(progress, 0.9, 1));
    const motionScale = viewportWidth <= 580 ? 0.45 : viewportWidth <= 820 ? 0.72 : 1;

    unknown.style.setProperty("--unknown-intro-alpha", (introIn * introOut).toFixed(4));
    unknown.style.setProperty("--unknown-intro-y", `${(28 * (1 - introIn) - 16 * (1 - introOut)).toFixed(2)}px`);
    unknown.style.setProperty("--unknown-copy-alpha", (range(progress, 0.17, 0.27) * introOut).toFixed(4));
    unknown.style.setProperty("--unknown-copy-y", `${(16 * (1 - range(progress, 0.17, 0.27))).toFixed(2)}px`);
    unknown.style.setProperty("--unknown-field-alpha", (0.2 + fieldStrength * 0.55).toFixed(4));
    unknown.style.setProperty("--unknown-near-alpha", (0.12 + fieldStrength * 0.48).toFixed(4));
    unknown.style.setProperty("--unknown-far-x", `${(-18 * progress * motionScale).toFixed(2)}px`);
    unknown.style.setProperty("--unknown-far-y", `${(-34 * progress * motionScale).toFixed(2)}px`);
    unknown.style.setProperty("--unknown-far-scale", (1 + progress * 0.08 * motionScale).toFixed(4));
    unknown.style.setProperty("--unknown-near-x", `${(25 * progress * motionScale).toFixed(2)}px`);
    unknown.style.setProperty("--unknown-near-y", `${(-62 * progress * motionScale).toFixed(2)}px`);
    unknown.style.setProperty("--unknown-near-scale", (1 + progress * 0.2 * motionScale).toFixed(4));

    unknownWords.forEach((word, index) => {
      const wordProgress = range(progress, -0.09 + index * 0.015, 0.045 + index * 0.015);
      word.style.setProperty("--word-alpha", wordProgress.toFixed(4));
      word.style.setProperty("--word-y", `${(22 * (1 - wordProgress)).toFixed(2)}px`);
    });

    const statementTiming = [
      { enter: 0.4, settle: 0.46, exit: 0.52, end: 0.58 },
      { enter: 0.58, settle: 0.64, exit: 0.7, end: 0.76 },
      { enter: 0.76, settle: 0.82, exit: 0.91, end: 0.98 },
    ];

    unknownStatements.forEach((statement, index) => {
      const timing = statementTiming[index];
      const statementIn = range(progress, timing.enter, timing.settle);
      const statementOut = 1 - range(progress, timing.exit, timing.end);
      const alpha = statementIn * statementOut;

      statement.style.setProperty("--statement-alpha", alpha.toFixed(4));
      statement.style.setProperty("--statement-y", `${(26 * (1 - statementIn) - 18 * (1 - statementOut)).toFixed(2)}px`);
      statement.style.setProperty("--statement-scale", (0.985 + statementIn * 0.015).toFixed(4));
      [...statement.children].forEach((word, wordIndex) => {
        const wordProgress = range(progress, timing.enter + wordIndex * 0.012, timing.settle + wordIndex * 0.012);
        word.style.setProperty("--word-alpha", wordProgress.toFixed(4));
        word.style.setProperty("--word-y", `${(18 * (1 - wordProgress)).toFixed(2)}px`);
      });
    });

    asteroids.forEach((asteroid, index) => {
      const motion = asteroidMotion[index];
      const travel = range(progress, motion.enter, motion.exit);
      const fadeIn = range(progress, motion.enter, motion.enter + 0.1);
      const fadeOut = 1 - range(progress, motion.exit - 0.08, motion.exit);
      const x = motion.x * (travel - 0.45) * motionScale;
      const y = motion.y * (travel - 0.45) * motionScale;
      const scale = motion.startScale + (motion.endScale - motion.startScale) * travel;
      const rotation = motion.rotation * travel;

      asteroid.style.setProperty("--asteroid-alpha", (fadeIn * fadeOut * 0.78).toFixed(4));
      asteroid.style.setProperty("--asteroid-transform", `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(4)}) rotate(${rotation.toFixed(2)}deg)`);
    });
  };

  const renderQuestions = () => {
    if (viewportWidth <= 820) return;
    const progress = progressFor(questions);
    const travel = range(progress, 0.06, 0.94);
    questions.style.setProperty("--questions-shift", `${(-2 * viewportWidth * travel).toFixed(2)}px`);
    questions.style.setProperty("--questions-heading-alpha", (1 - range(progress, 0.04, 0.2)).toFixed(4));

    questionPanels.forEach((panel, index) => {
      const center = index / 2;
      const emphasis = smooth(clamp(1 - Math.abs(travel - center) * 2));
      panel.style.setProperty("--panel-alpha", (0.28 + emphasis * 0.72).toFixed(4));
      panel.style.setProperty("--panel-image-y", `${(28 * (1 - emphasis)).toFixed(2)}px`);
      panel.style.setProperty("--panel-image-scale", (0.96 + emphasis * 0.04).toFixed(4));
      panel.style.setProperty("--panel-copy-y", `${(24 * (1 - emphasis)).toFixed(2)}px`);
    });
  };

  const renderClosing = () => {
    const progress = progressFor(closing);
    const enter = range(progress, 0.04, 0.24);
    closing.style.setProperty("--closing-content-alpha", enter.toFixed(4));
    closing.style.setProperty("--closing-content-y", `${(34 * (1 - enter)).toFixed(2)}px`);
    closing.style.setProperty("--closing-horizon-alpha", (0.12 + range(progress, 0.08, 0.94) * 0.8).toFixed(4));
    closing.style.setProperty("--closing-title-alpha", range(progress, 0.63, 0.8).toFixed(4));
    closing.style.setProperty("--closing-title-y", `${(24 * (1 - range(progress, 0.63, 0.8))).toFixed(2)}px`);
    closing.style.setProperty("--closing-link-alpha", range(progress, 0.79, 0.92).toFixed(4));
    closing.style.setProperty("--horizon-y", `${(-22 * progress).toFixed(2)}px`);
    closing.style.setProperty("--star-far-y", `${(-20 * progress).toFixed(2)}px`);
    closing.style.setProperty("--star-near-y", `${(-42 * progress).toFixed(2)}px`);
    closing.style.setProperty("--space-scale", (1 + progress * 0.025).toFixed(4));

    closingWords.forEach((word, index) => {
      const wordProgress = range(progress, 0.1 + index * 0.012, 0.32 + index * 0.012);
      word.style.setProperty("--word-alpha", wordProgress.toFixed(4));
      word.style.setProperty("--word-y", `${(16 * (1 - wordProgress)).toFixed(2)}px`);
    });
  };

  const render = () => {
    frame = 0;
    if (visibleSections.has(opening)) renderOpening();
    if (visibleSections.has(cosmos)) renderCosmos();
    if (visibleSections.has(questions)) renderQuestions();
    if (visibleSections.has(unknown)) renderUnknown();
    if (visibleSections.has(closing)) renderClosing();
  };

  const requestUpdate = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(render);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) visibleSections.add(entry.target);
      else visibleSections.delete(entry.target);
    });
    requestUpdate();
  }, { threshold: 0 });

  window.addEventListener("resize", () => {
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(() => {
      measure();
      requestUpdate();
    });
  }, { passive: true });

  sections.forEach((section) => observer.observe(section));
  measure();
  sections.forEach((section) => visibleSections.add(section));
  render();

  return { requestUpdate };
}
