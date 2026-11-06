// ATELIER MORCEGO — comportamento compartilhado (sem lógica de e-commerce)

var sharedScript = document.currentScript;

document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  var backdrop = document.querySelector('.nav-menu-backdrop');

  document.querySelectorAll('.comissao-trabalho, .product-card').forEach(function (card) {
    var primaryImage = card.querySelector('.thumb-image-primary, .product-image-primary');
    var alternateImage = card.querySelector('.thumb-image-hover, .product-image-hover');

    function showAlternateImage() {
      if (!primaryImage || !alternateImage) return;
      card.classList.add('is-image-hovered');
      primaryImage.style.opacity = '0';
      alternateImage.style.opacity = '1';
    }

    function hideAlternateImage() {
      card.classList.remove('is-image-hovered');
      if (primaryImage && alternateImage) {
        primaryImage.style.opacity = '';
        alternateImage.style.opacity = '';
      }
    }

    card.addEventListener('pointerenter', showAlternateImage);
    card.addEventListener('pointerleave', hideAlternateImage);
    card.addEventListener('focusin', showAlternateImage);
    card.addEventListener('focusout', function (event) {
      if (!card.contains(event.relatedTarget)) {
        hideAlternateImage();
      }
    });
  });

  var imageLightbox = document.querySelector('[data-image-lightbox]');
  var lightboxPhoto = imageLightbox && imageLightbox.querySelector('[data-lightbox-photo]');
  var lightboxClose = imageLightbox && imageLightbox.querySelector('[data-lightbox-close]');

  function closeImageLightbox() {
    if (!imageLightbox || !lightboxPhoto || !imageLightbox.open) return;
    imageLightbox.close();
    lightboxPhoto.removeAttribute('src');
    lightboxPhoto.alt = '';
  }

  if (imageLightbox && lightboxPhoto) {
    document.querySelectorAll('[data-lightbox-trigger]').forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        var hoverImage = trigger.querySelector('.thumb-image-hover, .selection-image-hover');
        var isHoverImageVisible = hoverImage && Number(getComputedStyle(hoverImage).opacity) > 0.5;
        var imageSource = isHoverImageVisible ? hoverImage.currentSrc : trigger.dataset.lightboxSrc;
        lightboxPhoto.src = new URL(imageSource, document.baseURI).href;
        lightboxPhoto.alt = trigger.dataset.lightboxAlt || '';
        imageLightbox.showModal();
      });
    });

    if (lightboxClose) {
      lightboxClose.addEventListener('click', function () {
        closeImageLightbox();
      });
    }

    imageLightbox.addEventListener('cancel', function (event) {
      event.preventDefault();
      closeImageLightbox();
    });

    imageLightbox.addEventListener('click', function (event) {
      if (event.target === imageLightbox) {
        closeImageLightbox();
      }
    });
  }

  function closeMenu() {
    if (!links) return;
    links.classList.remove('is-open');
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'false');
    }
    if (backdrop) {
      backdrop.classList.remove('is-visible');
    }
    document.body.classList.remove('nav-locked');
  }

  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var isOpen = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (backdrop) {
        backdrop.classList.toggle('is-visible', isOpen);
      }
      document.body.classList.toggle('nav-locked', isOpen);
    });

    links.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', closeMenu);
  }

  var cartToggle = document.querySelector('.nav-cart-toggle');
  var cartDrawer = document.querySelector('.cart-drawer');
  var cartBackdrop = document.querySelector('.cart-drawer-backdrop');
  var cartClose = document.querySelector('.cart-drawer-close');

  function closeCart() {
    if (!cartDrawer) return;
    cartDrawer.classList.remove('is-open');
    if (cartBackdrop) {
      cartBackdrop.classList.remove('is-open');
    }
    if (cartToggle) {
      cartToggle.classList.remove('is-active');
      cartToggle.setAttribute('aria-expanded', 'false');
    }
    document.body.classList.remove('nav-locked');
  }

  if (cartToggle && cartDrawer) {
    cartToggle.addEventListener('click', function (event) {
      event.preventDefault();
      var isOpen = cartDrawer.classList.toggle('is-open');
      cartToggle.classList.toggle('is-active', isOpen);
      cartToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (cartBackdrop) {
        cartBackdrop.classList.toggle('is-open', isOpen);
      }
      document.body.classList.toggle('nav-locked', isOpen);
    });
  }

  if (cartClose) {
    cartClose.addEventListener('click', closeCart);
  }

  if (cartBackdrop) {
    cartBackdrop.addEventListener('click', closeCart);
  }

  window.addEventListener('resize', function () {
    if (window.innerWidth > 980) {
      closeMenu();
      closeCart();
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      if (imageLightbox && imageLightbox.open) {
        event.preventDefault();
        closeImageLightbox();
      }
      closeMenu();
      closeCart();
    }
  });

  if (sharedScript) {
    var integrationsScript = document.createElement('script');
    integrationsScript.src = new URL('site-integrations.js', sharedScript.src).href;
    document.body.appendChild(integrationsScript);
  }

  var newsletterForm = document.querySelector('.newsletter-form');
  var newsletterFeedback = document.querySelector('.newsletter-feedback');
  if (newsletterForm && newsletterFeedback) {
    newsletterForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var emailInput = newsletterForm.querySelector('input[name="email"]');
      if (emailInput && emailInput.value.trim()) {
        newsletterFeedback.textContent = 'Obrigado! Seu e-mail foi registrado para novidades.';
        newsletterFeedback.style.opacity = '0.9';
        emailInput.value = '';
      }
    });
  }

  var sliderBtn = document.querySelector('.slider-toggle');
  var sliderTrack = document.querySelector('.slider-track');

  if (sliderBtn && sliderTrack) {
    sliderBtn.addEventListener('click', function () {
      var isPaused = sliderTrack.style.animationPlayState === 'paused';
      if (isPaused) {
        sliderTrack.style.animationPlayState = 'running';
        sliderBtn.setAttribute('aria-label', 'Pausar vitrine');
        sliderBtn.setAttribute('aria-pressed', 'false');
        sliderBtn.querySelector('.slider-toggle-icon').textContent = '⏸';
      } else {
        sliderTrack.style.animationPlayState = 'paused';
        sliderBtn.setAttribute('aria-label', 'Retomar vitrine');
        sliderBtn.setAttribute('aria-pressed', 'true');
        sliderBtn.querySelector('.slider-toggle-icon').textContent = '▶';
      }
    });
  }
});
