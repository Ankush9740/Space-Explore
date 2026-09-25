// Shared navigation, scroll effects and page interactions.
document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".site-header");
  const menuButton = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");
  const scrollButton = document.querySelector(".scroll-top");

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

  setupGallery();
  setupContactForm();
});

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
