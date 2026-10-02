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

    const whatsappUrl = 'https://wa.me/918471986282?text=' + encodeURIComponent(message);
    const opened = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    if (!opened && error) {
      error.textContent = 'Your browser blocked the WhatsApp window. Please allow pop-ups for this page or use the WhatsApp button.';
      error.hidden = false;
    }
  });
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