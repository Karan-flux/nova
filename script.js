window.novariyanContent = {
  settings: { whatsappNumber: '918471986282' },
  projects: []
};

(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const mobileMenu = document.querySelector('#mobile-menu');

  function closeMenu() {
    if (!menuButton || !mobileMenu) return;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
    mobileMenu.hidden = true;
  }

  menuButton?.addEventListener('click', () => {
    if (!mobileMenu) return;

    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
    mobileMenu.hidden = isOpen;
  });

  mobileMenu?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 760) closeMenu();
  });

  const year = document.querySelector('#year');
  if (year) year.textContent = new Date().getFullYear();

  const form = document.querySelector('#enquiry-form');
  const error = document.querySelector('#form-error');
  form?.addEventListener('submit', event => {
    event.preventDefault();
    if (error) error.hidden = true;

    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const fields = [
      ['Name', data.get('name')],
      ['Business', data.get('business')],
      ['Industry', data.get('industry')],
      ['Service required', data.get('service')],
      ['Budget', data.get('budget')],
      ['Project details', data.get('message')]
    ];
    const message = [
      'Hello Novariyan, I would like to discuss a project.',
      '',
      ...fields.map(([label, value]) => `${label}: ${String(value || '').trim()}`)
    ].join('\n');

    const phone = String(window.novariyanContent.settings.whatsappNumber || '918471986282').replace(/\D/g, '');
    const whatsappUrl = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(message);
    const opened = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    if (!opened && error) {
      error.textContent = 'Your browser blocked the WhatsApp window. Please allow pop-ups for this page or use the WhatsApp button.';
      error.hidden = false;
    }
  });
})();

(() => {
  const projectGrid = document.querySelector('#project-grid');

  function getWhatsAppNumber(settings) {
    return String(settings.whatsappNumber || '').replace(/\D/g, '');
  }

  function formatPhoneNumber(number) {
    const digits = getWhatsAppNumber({ whatsappNumber: number });
    if (digits.length === 12 && digits.startsWith('91')) return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
    return digits ? `+${digits}` : '';
  }

  function renderProjects(projects) {
    if (!projectGrid) return;
    projectGrid.replaceChildren();
    projects.forEach((project, index) => {
      const card = document.createElement('article');
      const variation = ['concept-tall', 'concept-offset', 'concept-wide'][index];
      card.className = `concept${variation ? ` ${variation}` : ''}`;

      const imageWrap = document.createElement('div');
      imageWrap.className = 'concept-image';
      if (project.image_url) {
        const image = document.createElement('img');
        image.src = project.image_url;
        image.alt = project.image_alt || '';
        image.loading = 'lazy';
        imageWrap.append(image);
      }

      const label = document.createElement('span');
      label.className = 'concept-label';
      label.textContent = project.description || `PROJECT ${String(index + 1).padStart(2, '0')}`;
      const arrow = document.createElement('span');
      arrow.className = 'concept-arrow';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '↗';
      imageWrap.append(label, arrow);

      const meta = document.createElement('div');
      meta.className = 'concept-meta';
      const details = document.createElement('div');
      const title = document.createElement('h3');
      title.textContent = project.title;
      const category = document.createElement('p');
      category.textContent = project.category;
      details.append(title, category);
      const number = document.createElement('span');
      number.className = 'concept-index';
      number.textContent = `A—${String(index + 1).padStart(2, '0')}`;
      meta.append(details, number);
      card.append(imageWrap, meta);
      projectGrid.append(card);
    });
  }

  function applyContent(content) {
    const settings = content.settings || {};
    window.novariyanContent = content;
    document.querySelectorAll('[data-cms]').forEach((element) => {
      const value = settings[element.dataset.cms];
      if (typeof value === 'string') element.textContent = value;
    });
    document.querySelectorAll('.wordmark > span').forEach((element) => {
      element.textContent = String(settings.brandName || 'Novariyan').toLowerCase();
    });
    document.querySelectorAll('[data-brand]').forEach((element) => {
      element.textContent = settings.brandName || 'Novariyan';
    });
    document.querySelectorAll('[data-cms-image], .brand-logo').forEach((image) => {
      const key = image.dataset.cmsImage || 'logoImageUrl';
      const value = settings[key];
      if (typeof value === 'string' && (value.startsWith('/') || value.startsWith('https://'))) image.src = value;
    });
    if (/^#[0-9a-f]{6}$/i.test(settings.accentColor || '')) {
      document.documentElement.style.setProperty('--red', settings.accentColor);
    }

    const phone = formatPhoneNumber(settings.whatsappNumber);
    document.querySelectorAll('[data-phone]').forEach((element) => { element.textContent = phone; });
    document.querySelectorAll('[data-whatsapp-message]').forEach((link) => {
      const digits = getWhatsAppNumber(settings);
      const message = link.dataset.whatsappMessage || 'Hello Novariyan';
      if (digits) link.href = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
    });

    document.title = `${settings.brandName || 'Novariyan'} | AI & Digital Agency for Websites, Automation & Growth`;
    updateStructuredData(settings, phone);
    renderProjects(Array.isArray(content.projects) ? content.projects : []);
  }

  function updateStructuredData(settings, phone) {
    const origin = window.location.origin;
    if (origin && origin !== 'null') {
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) canonical.href = `${origin}/`;
      const openGraphUrl = document.querySelector('meta[property="og:url"]');
      if (openGraphUrl) openGraphUrl.content = `${origin}/`;
      const logo = document.querySelector('script[type="application/ld+json"]');
      if (logo) {
        try {
          const data = JSON.parse(logo.textContent);
          for (const item of data['@graph'] || []) {
            if (item.logo?.url) item.logo.url = `${origin}/logo.png`;
          }
          logo.textContent = JSON.stringify(data);
        } catch {}
      }
    }
    const schema = document.querySelector('script[type="application/ld+json"]');
    if (!schema) return;
    try {
      const data = JSON.parse(schema.textContent);
      for (const item of data['@graph'] || []) {
        if (item.name) item.name = settings.brandName || item.name;
        if (item.url && origin && origin !== 'null') item.url = `${origin}/`;
        if (phone && item.telephone) item.telephone = phone;
      }
      schema.textContent = JSON.stringify(data);
    } catch {}
  }

  fetch('/api/content')
    .then((response) => {
      if (!response.ok) throw new Error(`Content request failed (${response.status}).`);
      return response.json();
    })
    .then(applyContent)
    .catch((error) => console.error('Could not load website content:', error));
})();
/* =========================================================
   COOKIE CONSENT
   ========================================================= */

(() => {
  const COOKIE_KEY = "novariyan_cookie_preferences";

  const banner = document.querySelector("#cookie-banner");
  const settingsPanel = document.querySelector("#cookie-settings-panel");

  const acceptButton = document.querySelector("#cookie-accept");
  const rejectButton = document.querySelector("#cookie-reject");
  const settingsButton = document.querySelector("#cookie-settings");

  const closeSettingsButton = document.querySelector(
    "#cookie-settings-close"
  );

  const saveButton = document.querySelector("#cookie-save");

  const manageButton = document.querySelector("#cookie-manage");

  const analyticsToggle = document.querySelector("#cookie-analytics");
  const marketingToggle = document.querySelector("#cookie-marketing");
  let previousFocus = null;


  function getPreferences() {
    try {
      const saved = localStorage.getItem(COOKIE_KEY);

      if (!saved) return null;

      return JSON.parse(saved);
    } catch {
      return null;
    }
  }


  function savePreferences(preferences) {
    try {
      localStorage.setItem(
        COOKIE_KEY,
        JSON.stringify({
          ...preferences,
          savedAt: new Date().toISOString()
        })
      );
    } catch {}

    applyPreferences(preferences);
  }


  function applyPreferences(preferences) {

    /*
     * IMPORTANT:
     *
     * Put Google Analytics, Meta Pixel or other optional
     * tracking scripts inside this section when you add them.
     *
     * They should NOT load before the appropriate consent
     * has been given.
     */

    if (preferences.analytics) {
      // Load analytics here after consent.
    }

    if (preferences.marketing) {
      // Load marketing technologies here after consent.
    }
  }


  function hideBanner() {
    if (banner) {
      banner.hidden = true;
    }
  }


  function showBanner() {
    if (banner) {
      banner.hidden = false;
    }
  }


  function openSettings() {

    if (!settingsPanel) return;
    previousFocus = document.activeElement;

    const current = getPreferences();

    if (current) {
      if (analyticsToggle) {
        analyticsToggle.checked = Boolean(current.analytics);
      }

      if (marketingToggle) {
        marketingToggle.checked = Boolean(current.marketing);
      }
    }

    settingsPanel.hidden = false;

    document.body.style.overflow = "hidden";
    closeSettingsButton?.focus();
  }


  function closeSettings(restoreFocus = true) {

    if (!settingsPanel) return;

    settingsPanel.hidden = true;

    document.body.style.overflow = "";

    if (restoreFocus) {
      const focusTarget = previousFocus?.isConnected && previousFocus !== document.body
        ? previousFocus
        : manageButton;
      focusTarget?.focus();
    }
  }


  function showManageButton() {

    if (manageButton) {
      manageButton.hidden = false;
    }
  }


  function acceptAll() {

    savePreferences({
      necessary: true,
      analytics: true,
      marketing: true
    });

    hideBanner();
    showManageButton();
  }


  function rejectOptional() {

    savePreferences({
      necessary: true,
      analytics: false,
      marketing: false
    });

    hideBanner();
    showManageButton();
  }


  function saveCustomPreferences() {

    savePreferences({
      necessary: true,
      analytics: Boolean(
        analyticsToggle?.checked
      ),
      marketing: Boolean(
        marketingToggle?.checked
      )
    });

    hideBanner();
    showManageButton();
    closeSettings(false);
    manageButton?.focus();
  }


  acceptButton?.addEventListener(
    "click",
    acceptAll
  );


  rejectButton?.addEventListener(
    "click",
    rejectOptional
  );


  settingsButton?.addEventListener(
    "click",
    openSettings
  );


  manageButton?.addEventListener(
    "click",
    openSettings
  );


  closeSettingsButton?.addEventListener(
    "click",
    closeSettings
  );


  saveButton?.addEventListener(
    "click",
    saveCustomPreferences
  );


  settingsPanel?.addEventListener(
    "click",
    event => {

      if (event.target === settingsPanel) {
        closeSettings();
      }

    }
  );


  document.addEventListener(
    "keydown",
    event => {

      if (!settingsPanel || settingsPanel.hidden) return;

      if (event.key === "Escape") {
        closeSettings();
        return;
      }

      if (event.key === "Tab") {
        const focusable = [...settingsPanel.querySelectorAll(
          'button:not([disabled]), input:not([disabled]), a[href], select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )].filter(element => !element.hidden && element.getClientRects().length);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (!first) return;

        if (event.shiftKey && (document.activeElement === first || !settingsPanel.contains(document.activeElement))) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !settingsPanel.contains(document.activeElement))) {
          event.preventDefault();
          first.focus();
        }
      }

    }
  );


  const existingPreferences = getPreferences();


  if (existingPreferences) {

    applyPreferences(existingPreferences);
    hideBanner();
    showManageButton();

  } else {

    showBanner();

  }

})();