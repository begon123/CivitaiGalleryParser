// content.js - Civitai Image Parser
// Unified Overlay Interface (Premium Layout)

// --- Global State ---
const STATE = {
  collectedData: [],
  seenSrcSet: new Set(),
  isScanning: false,
  stopRequested: false,
  pageLimit: 0,
  currentAuthor: '...',
  isUserLoggedIn: null,
  scanCompleted: false
};

// --- Selectors & Config ---
const SELECTOR_CONFIG = {
  galleryImage: 'img',
  cardLink: 'a',
  cardContainer: 'div[class*="mantine-Card"], div[class*="Card"], a[class*="mantine-UnstyledButton"]',
  profileCover: '[class*="ProfileHeader_coverImage"]',
  mainScrollContainers: 'div, main',
  loginLinks: ['a[href^="/login"]', 'a[href^="/api/auth/signin"]'],
  profileLinks: 'a[href^="/user/"]',
  modalOpenClass: 'mantine-Modal-open',
  modalButtons: ['button', 'div[role="button"]', 'a[role="button"]', 'span[role="button"]'],
  overlays: [
    '.mantine-Modal-overlay',
    '.mantine-Overlay-root',
    'div[class*="backdrop"]',
    'div[class*="overlay"]',
    'div[style*="z-index: 200"]',
    'div[style*="z-index: 1000"]'
  ],
  icons: {
    likes: ['M7 11v8a1 1 0 0 1-1 1', 'thumb-up', 'tabler-icon-thumb-up', 'd="M7 11v8a1 1 0 0 1-1 1'],
    hearts: ['M19.5 12.572', 'heart', 'tabler-icon-heart'],
    laughs: ['mood-laugh', 'tabler-icon-mood-laugh'],
    cries: ['mood-cry', 'tabler-icon-mood-cry'],
    moodSmile: ['mood-smile', 'tabler-icon-mood-smile']
  }
};

const CONFIG = {
  MIN_IMAGE_SIZE: 150,
  MODAL_KEYWORDS: ['accept', 'agree', 'allow', 'i am 18', 'over 18', 'mature', 'confirm', 'close', 'dismiss', 'maybe later', 'reject'],
  EMOJI_MAP: { '👍': 'likes', '❤️': 'hearts', '😂': 'laughs', '😢': 'cries' }
};

// --- UI_CONTROLLER ---
const UI_CONTROLLER = {
  overlay: null,

  injectStyles() {
    if (document.getElementById('cp-styles')) return;
    const link = document.createElement('link');
    link.id = 'cp-styles';
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('overlay.css');
    document.head.appendChild(link);
  },

  async toggle() {
    if (this.overlay) {
      if (this.overlay.classList.contains('closing')) return;
      this.overlay.classList.add('closing');
      STATE.isScanning = false;
      STATE.stopRequested = true;

      setTimeout(() => {
        // Отправляем данные в background только если сканирование завершилось ПОЛНОСТЬЮ
        if (STATE.scanCompleted && STATE.collectedData && STATE.collectedData.length > 0) {
          chrome.runtime.sendMessage({ action: 'save_data', data: STATE.collectedData, author: STATE.currentAuthor });
          STATE.collectedData = [];
        }

        if (STATE.scanCompleted) {
            location.reload();
        } else {
            // Если была отмена — просто удаляем оверлей и чистим ссылку
            if (this.overlay) {
                this.overlay.remove();
                this.overlay = null;
                STATE.isScanning = false;
                STATE.stopRequested = false;
            }
        }
      }, 1500);
    } else {
      await I18N.init();
      this.injectStyles();
      this.overlay = document.createElement('div');
      this.overlay.id = 'cp-root';
      this.overlay.className = 'cp-root';
      document.body.appendChild(this.overlay);

      const match = window.location.href.match(/\/user\/([^/]+)/);
      STATE.currentAuthor = match ? match[1] : '...';
      STATE.isUserLoggedIn = await this.checkLogin();

      this.render();
    }
  },

  async softReset() {
    this.update(I18N.t('content_initializing'));

    // 1. Clear State
    STATE.collectedData = [];
    STATE.seenSrcSet = new Set();
    STATE.stopRequested = false;
    STATE.scanCompleted = false;

    // 2. Clear DOM markers
    document.querySelectorAll('[data-parsed]').forEach(el => el.removeAttribute('data-parsed'));

    // 3. Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const scroller = SCROLLER.findMainScroller();
    if (scroller !== window) scroller.scrollTo({ top: 0, behavior: 'smooth' });

    // Wait for scroll to settle
    await new Promise(r => setTimeout(r, 800));
  },

  async checkLogin() {
    return !document.querySelector(SELECTOR_CONFIG.loginLinks.join(','));
  },

  render() {
    if (!this.overlay) return;
    this.overlay.innerHTML = `
      <div class="cp-header">
        <div class="cp-header-left">
          <div id="cp-badge" class="cp-badge ${STATE.isUserLoggedIn ? 'ok' : ''}">
            <div class="cp-dot"></div>
            <span id="cp-badge-text" class="cp-badge-text" data-i18n="${STATE.isUserLoggedIn ? 'popup_logged_in' : 'popup_not_logged_in'}">${I18N.t(STATE.isUserLoggedIn ? 'popup_logged_in' : 'popup_not_logged_in')}</span>
          </div>
        </div>

        <h2 class="cp-title" data-i18n="popup_header_title">${I18N.t('popup_header_title')}</h2>

        <div class="cp-header-right">
          <div class="cp-lang-wrapper">
            <input type="radio" name="cp-l" id="cp-l-en" ${I18N.lang === 'en' ? 'checked' : ''}>
            <input type="radio" name="cp-l" id="cp-l-ru" ${I18N.lang === 'ru' ? 'checked' : ''}>
            <div class="slider"></div>
            <label for="cp-l-en">
                <span class="flag-icon">
                    <svg viewBox="0 0 60 40" width="100%" height="100%" preserveAspectRatio="none">
                        <rect width="60" height="40" fill="#fff"/><rect width="60" height="7" y="0" fill="#B22234"/><rect width="60" height="7" y="11" fill="#B22234"/><rect width="60" height="7" y="22" fill="#B22234"/><rect width="60" height="7" y="33" fill="#B22234"/><rect width="26" height="22" fill="#3C3B6E"/>
                        <g fill="#fff"><circle cx="5" cy="4" r="1.5"/><circle cx="13" cy="4" r="1.5"/><circle cx="21" cy="4" r="1.5"/><circle cx="9" cy="8" r="1.5"/><circle cx="17" cy="8" r="1.5"/><circle cx="5" cy="12" r="1.5"/><circle cx="13" cy="12" r="1.5"/><circle cx="21" cy="12" r="1.5"/><circle cx="9" cy="16" r="1.5"/><circle cx="17" cy="16" r="1.5"/></g>
                    </svg>
                </span> EN
            </label>
            <label for="cp-l-ru">
                <span class="flag-icon">
                    <svg viewBox="0 0 60 40" width="100%" height="100%" preserveAspectRatio="none">
                        <rect width="60" height="13.33" y="0" fill="#FFFFFF"/><rect width="60" height="13.34" y="13.33" fill="#0039A6"/><rect width="60" height="13.33" y="26.67" fill="#D52B1E"/>
                    </svg>
                </span> RU
            </label>
          </div>
        </div>
      </div>

      <div class="cp-stats">
        <div class="cp-line"></div>
        <span id="cp-val" class="cp-num">0</span>
        <span class="cp-desc" data-i18n="popup_found_label">${I18N.t('popup_found_label')}</span>
      </div>

      <div class="cp-row">
        <div class="cp-col">
          <div class="cp-input-wrap">
            <input type="text" id="cp-pages" value="стр">
            <div class="cp-input-ctrls">
                <button id="cp-p-up" class="cp-ctrl-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 15l-6-6-6 6"/></svg>
                </button>
                <button id="cp-p-down" class="cp-ctrl-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 9l6 6 6-6"/></svg>
                </button>
            </div>
          </div>
        </div>
        <button id="cp-main-btn">
            <svg class="cp-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M23 4v6h-6" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            <span data-i18n="popup_scan_btn">${I18N.t('popup_scan_btn')}</span>
        </button>
      </div>

      <div class="cp-warn" data-i18n="popup_scan_warning">⚠️ ${I18N.t('popup_scan_warning')}</div>

      <div class="cp-term">
        <div class="cp-t-head"><span>Console</span><span id="cp-per">0%</span></div>
        <div id="cp-logs" class="cp-logs">
           <div class="cp-log" style="opacity: 0.3;"><span>> ${I18N.t('popup_terminal_ready')}</span></div>
        </div>
      </div>

      <div class="cp-bottom">
        <button id="cp-stop" disabled>
            <svg class="cp-stop-icon" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
            <span data-i18n="content_stop">${I18N.t('content_stop')}</span>
        </button>
      </div>
    `;
    this.attachEvents();
  },

  updateTranslations() {
    this.overlay.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      let text = I18N.t(key);
      if (key === 'popup_scan_warning') text = '⚠️ ' + text;
      if (key === 'popup_pages_label') {
        el.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="cp-page-icon">
            <path d="M12 11L20 7L12 3L4 7L12 11Z" fill="rgba(255,255,255,0.2)" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" transform="translate(0, 8)"/>
            <path d="M12 11L20 7L12 3L4 7L12 11Z" fill="rgba(255,255,255,0.4)" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" transform="translate(0, 4)"/>
            <path d="M12 11L20 7L12 3L4 7L12 11Z" fill="white" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
            <path d="M8 7L12 9M12 9L16 7" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
          </svg> ${text}`;
      } else {
        el.textContent = text;
      }
    });
  },

  attachEvents() {
    const input = document.getElementById('cp-pages');
    const mainBtn = document.getElementById('cp-main-btn');

    const updateStartBtn = () => {
      if (mainBtn) mainBtn.disabled = STATE.pageLimit < 1 || STATE.isScanning;
    };
    
    const updateInputText = () => {
      if (STATE.pageLimit <= 0) {
        input.value = 'стр';
        input.style.color = '#94a3b8'; // Dimmed color for placeholder
      } else {
        input.value = STATE.pageLimit;
        input.style.color = '#1e293b'; // Main text color
      }
      updateStartBtn();
    };

    input.onfocus = () => {
      if (input.value === 'стр') {
        input.value = '';
        input.style.color = '#1e293b';
      }
    };

    input.onblur = () => {
      if (input.value.trim() === '' || parseInt(input.value) <= 0) {
        STATE.pageLimit = 0;
        updateInputText();
      }
    };

    input.oninput = (e) => {
      let val = e.target.value.replace(/[^0-9]/g, '');
      let num = parseInt(val) || 0;
      if (num > 1000) num = 1000;
      STATE.pageLimit = num;
      if (val !== '') e.target.value = num;
      this.update(I18N.t('terminal_pages_set', { count: STATE.pageLimit }));
      updateStartBtn();
    };

    const updateBtns = () => {
      STATE.pageLimit = Math.max(0, Math.min(1000, STATE.pageLimit));
      updateInputText();
      this.update(I18N.t('terminal_pages_set', { count: STATE.pageLimit }));
    };

    document.getElementById('cp-p-up').onclick = () => {
      if (STATE.isScanning) return;
      STATE.pageLimit++;
      updateBtns();
    };
    document.getElementById('cp-p-down').onclick = () => {
      if (STATE.isScanning) return;
      if (STATE.pageLimit > 0) STATE.pageLimit--;
      updateBtns();
    };

    const handleLang = async (lang) => {
      await I18N.setLang(lang);
      this.updateTranslations();
      this.update(I18N.t('terminal_lang_switched', { lang: I18N.t(lang === 'en' ? 'terminal_lang_en' : 'terminal_lang_ru') }));
    };
    document.getElementById('cp-l-en').onclick = () => handleLang('en');
    document.getElementById('cp-l-ru').onclick = () => handleLang('ru');

    document.getElementById('cp-main-btn').onclick = () => this.start();
    document.getElementById('cp-stop').onclick = () => {
      STATE.stopRequested = true;
      STATE.collectedData = [];
      STATE.seenSrcSet = new Set();
      this.animateCounter(0);
      
      const b = document.getElementById('cp-stop');
      b.textContent = I18N.t('content_stopping');
      b.disabled = true;
    };

    updateStartBtn();
  },

  update(text, cur, total) {
    if (!this.overlay) return;
    this.animateCounter(STATE.collectedData.length);
    const p = document.getElementById('cp-per');
    if (p) p.textContent = `${Math.round((cur / (total || 1)) * 100)}%`;
    const l = document.getElementById('cp-logs');
    if (l) {
      const time = new Date().toLocaleTimeString([], { hour12: false });
      const row = document.createElement('div');
      row.className = 'cp-log';
      row.innerHTML = `<span class="cp-mark">[${time}]</span><span>${text}</span>`;
      l.appendChild(row);
      l.scrollTop = l.scrollHeight;
    }
  },

  _counterAnim: null,
  animateCounter(target) {
    const el = document.getElementById('cp-val');
    if (!el) return;
    const start = parseInt(el.textContent) || 0;
    if (start === target) return;

    if (this._counterAnim) cancelAnimationFrame(this._counterAnim);

    const duration = 1200; // Премиальная длительность анимации
    const startTime = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      // Cubic-out easing для эффектного замедления
      const ease = 1 - Math.pow(1 - progress, 3);
      const val = Math.floor(start + (target - start) * ease);

      el.textContent = val;

      if (progress < 1) {
        this._counterAnim = requestAnimationFrame(tick);
      } else {
        this._counterAnim = null;
      }
    };
    this._counterAnim = requestAnimationFrame(tick);
  },

  async start() {
    await this.softReset();

    STATE.isScanning = true;
    STATE.stopRequested = false;
    this.overlay.classList.add('scanning');

    document.getElementById('cp-main-btn').disabled = true;
    document.getElementById('cp-stop').disabled = false;
    const badge = document.getElementById('cp-badge');
    badge.className = 'cp-badge active';
    document.getElementById('cp-badge-text').textContent = I18N.t('popup_scanning');

    this.update(I18N.t('terminal_scan_init', { pages: STATE.pageLimit }), 0, 100);
    await SCROLLER.run(parseInt(STATE.pageLimit) || 1);

    if (STATE.stopRequested) {
      this.update(I18N.t('content_stopped'), 0, 0);
    } else {
      STATE.scanCompleted = true;
      this.update(I18N.t('content_scan_complete'), 100, 100);
    }

    // Увеличил до 1.5с, чтобы пользователь успел увидеть "Завершено" и анимацию
    await new Promise(r => setTimeout(r, 1500));
    this.toggle();
  }
};

const DATA_EXTRACTOR = {
  parseNumber(text) {
    if (!text) return 0
    const normalized = text.replace(/[\n\r]+/g, ' ').trim()
    const match = normalized.match(/(\d+(?:\.\d+)?)\s*([kKmM])?/)
    if (!match) return 0
    let value = parseFloat(match[1])
    const suffix = match[2] ? match[2].toLowerCase() : null
    if (suffix === 'k') value *= 1000
    else if (suffix === 'm') value *= 1000000
    return Math.round(value)
  },

  findAllNumbers(str) {
    if (!str) return []
    const normalized = str.replace(/[\n\r]+/g, ' ')
    // Сделал суффикс k/m опциональным (?), чтобы находить обычные числа тоже
    const matches = normalized.match(/(\d+(?:\.\d+)?)\s*([kKmM])?/g)
    return matches ? matches.map(m => this.parseNumber(m)).filter(n => n > 0) : []
  },

  findValueNearElement(element) {
    const parent = element.parentElement
    let potentialTextToCheck = ''
    if (parent) potentialTextToCheck += (parent.innerText || '') + ' '
    if (element.nextSibling) potentialTextToCheck += (element.nextSibling.textContent || '') + ' '
    const numbers = this.findAllNumbers(potentialTextToCheck)
    return numbers.length > 0 ? numbers[0] : 0
  },

  extractStats(container) {
    const stats = { likes: 0, hearts: 0, laughs: 0, cries: 0, total: 0, hasMoodSmile: false, rawNumbers: [] }
    if (!container) return stats

    // Метод 1 (основной): Web Component number-flow-react
    const numberFlows = container.querySelectorAll('number-flow-react')
    if (numberFlows.length >= 4) {
      const reactionTypes = ['likes', 'hearts', 'laughs', 'cries']
      for (let i = 0; i < Math.min(numberFlows.length, reactionTypes.length); i++) {
        try {
          const data = JSON.parse(numberFlows[i].getAttribute('data'))
          const val = typeof data.value === 'number' ? data.value : parseInt(data.value) || 0
          stats[reactionTypes[i]] = val
          if (val > 0 && !stats.rawNumbers.includes(val)) stats.rawNumbers.push(val)
        } catch (e) { /* JSON parse error — пропускаем */ }
      }
      // Проверяем наличие mood-smile
      const html = container.innerHTML || ''
      if (SELECTOR_CONFIG.icons.moodSmile.some(sig => html.includes(sig))) {
        stats.hasMoodSmile = true
      }
      stats.total = stats.likes + stats.hearts + stats.laughs + stats.cries
      return stats
    }

    // Метод 2 (fallback): Эмодзи в HTML
    const containerText = container.textContent || ''
    const containerHTML = container.innerHTML || ''

    for (const [emoji, type] of Object.entries(CONFIG.EMOJI_MAP)) {
      if (containerText.includes(emoji) || containerHTML.includes(emoji)) {
        const parts = containerHTML.split(emoji)
        if (parts.length > 1) {
          const numbers = this.findAllNumbers(parts[1].substring(0, 50))
          if (numbers.length > 0) stats[type] = Math.max(stats[type], numbers[0])
        }
      }
    }

    // Метод 3 (fallback): SVG-сигнатуры
    container.querySelectorAll('svg').forEach(svg => {
      const svgSignature = (svg.getAttribute('class') || '') + ' ' + svg.innerHTML
      let iconType = null
      for (const [type, signatures] of Object.entries(SELECTOR_CONFIG.icons)) {
        if (signatures.some(sig => svgSignature.includes(sig))) { iconType = type; break }
      }

      if (iconType) {
        if (iconType === 'moodSmile') {
          stats.hasMoodSmile = true
        } else {
          const val = this.findValueNearElement(svg)
          if (val > 0) {
            stats[iconType] = Math.max(stats[iconType], val)
            if (!stats.rawNumbers.includes(val)) stats.rawNumbers.push(val)
          }
        }
      }
    })

    stats.total = stats.likes + stats.hearts + stats.laughs + stats.cries
    return stats
  },

  validateImage(img) {
    let src = img.src
    if ((!src || src.startsWith('data:')) && img.dataset.src) src = img.dataset.src
    if (!src || (src.startsWith('data:') && src.includes('svg'))) return { isValid: false }
    if (STATE.seenSrcSet.has(src)) return { isValid: false }

    const parentLink = img.closest(SELECTOR_CONFIG.cardLink)
    let href = parentLink ? parentLink.getAttribute('href') : src
    if (href && !href.startsWith('http')) href = `https://civitai.com${href}`

    if (img.alt && img.alt.includes('Avatar')) return { isValid: false }
    const parentDiv = img.closest('div')
    if (parentDiv) {
      const style = window.getComputedStyle(parentDiv)
      if (style.borderRadius === '1000px' || style.borderRadius === '50%') return { isValid: false }
    }

    if ((img.width || 0) < CONFIG.MIN_IMAGE_SIZE || (img.height || 0) < CONFIG.MIN_IMAGE_SIZE) return { isValid: false }
    if (img.closest(SELECTOR_CONFIG.profileCover)) return { isValid: false }

    return { isValid: true, src, href }
  },

  findCardContainer(img) {
    let currentElement = img.parentElement
    const maxLevels = 5
    const emojisToFind = ['👍', '❤️', '😂', '😢', '⚡', '☁️']

    for (let i = 0; i < maxLevels; i++) {
      if (!currentElement || currentElement === document.body) break
      if (currentElement.querySelectorAll('img').length > 1) break

      // Приоритет: number-flow-react (Web Component для счётчиков)
      if (currentElement.querySelectorAll('number-flow-react').length >= 4) {
        return currentElement
      }

      const text = currentElement.innerText || ''
      const html = currentElement.innerHTML || ''
      if (emojisToFind.some(emoji => text.includes(emoji)) || SELECTOR_CONFIG.icons.moodSmile.some(sig => html.includes(sig))) {
        return currentElement
      }
      currentElement = currentElement.parentElement
    }
    return img.closest(SELECTOR_CONFIG.cardContainer) || img.parentElement
  },

  scan() {
    const images = Array.from(document.querySelectorAll(`${SELECTOR_CONFIG.galleryImage}:not([data-parsed])`))
    let found = 0

    for (const img of images) {
      img.setAttribute('data-parsed', 'true')
      const validation = this.validateImage(img)
      if (!validation.isValid) continue

      const { src, href } = validation
      let stats = { total: 0 }

      // Extract numeric image ID from href (e.g. /images/122465192)
      let imageId = 0
      if (href) {
        const idMatch = href.match(/\/images\/(\d+)/)
        if (idMatch) imageId = parseInt(idMatch[1]) || 0
      }

      try {
        const container = this.findCardContainer(img)
        if (container) {
          stats = this.extractStats(container)
        }
      } catch (e) { }

      STATE.seenSrcSet.add(src)
      STATE.collectedData.push({ src, href, alt: '', stats, imageId })
      found++
    }
    return found
  }
};

const SCROLLER = {
  unlockScroll() {
    document.body.classList.remove(SELECTOR_CONFIG.modalOpenClass)
    document.documentElement.classList.remove(SELECTOR_CONFIG.modalOpenClass)
    document.body.style.overflow = 'visible'
    document.body.style.overflowX = 'hidden'
    document.documentElement.style.overflow = 'visible'

    document.querySelectorAll(SELECTOR_CONFIG.modalButtons.join(',')).forEach(btn => {
      if (CONFIG.MODAL_KEYWORDS.some(kw => (btn.innerText || '').toLowerCase().includes(kw)) && btn.offsetParent !== null) {
        try { btn.click() } catch (e) { }
      }
    })

    SELECTOR_CONFIG.overlays.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        const style = window.getComputedStyle(el)
        if ((style.position === 'fixed' || style.position === 'absolute') && parseInt(style.zIndex) > 50) {
          try { el.remove() } catch (e) { }
        }
      })
    })
  },

  findMainScroller() {
    const candidates = document.querySelectorAll(SELECTOR_CONFIG.mainScrollContainers)
    let best = null, maxH = 0
    candidates.forEach(el => {
      if (el.scrollHeight > el.clientHeight + 50) {
        const s = window.getComputedStyle(el)
        if (['auto', 'scroll'].includes(s.overflowY) && el.scrollHeight > maxH) {
          maxH = el.scrollHeight; best = el
        }
      }
    })
    return best || window
  },

  async performScroll(target, step) {
    try {
      if (target === window) window.scrollBy({ top: step, behavior: 'smooth' })
      else target.scrollBy({ top: step, behavior: 'smooth' })

      const key = ['PageDown', 'End'][Math.floor(Math.random() * 2)]
      const el = document.activeElement || document.body
      el.dispatchEvent(new KeyboardEvent('keydown', { key, code: key, bubbles: true }))
      setTimeout(() => el.dispatchEvent(new KeyboardEvent('keyup', { key, code: key, bubbles: true })), 50)
      target.dispatchEvent(new WheelEvent('wheel', { deltaY: step, bubbles: true }))
    } catch (e) { console.error(e) }
  },

  async run(limit) {
    this.unlockScroll()
    const scroller = this.findMainScroller()
    let consecutiveNoNewItems = 0
    const MAX_IDLE_STEPS = 3

    for (let i = 0; i < limit; i++) {
      if (STATE.stopRequested) break
      UI_CONTROLLER.update(I18N.t('content_scanning_step', { current: i + 1, total: limit }), i + 1, limit)

      let foundInThisStep = 0
      const step = window.innerHeight * 0.5

      for (let s = 0; s < 10; s++) {
        if (STATE.stopRequested) break
        this.unlockScroll()
        await this.performScroll(scroller, step)

        // Микро-вибрация: гарантированный запуск подгрузки через IntersectionObserver
        if (scroller === window) {
          window.scrollBy(0, 3); await new Promise(r => setTimeout(r, 50)); window.scrollBy(0, -3);
        } else {
          scroller.scrollTop += 3; await new Promise(r => setTimeout(r, 50)); scroller.scrollTop -= 3;
        }

        await new Promise(r => setTimeout(r, 1500))
        const found = DATA_EXTRACTOR.scan()
        foundInThisStep += found
        if (found > 0) {
          UI_CONTROLLER.update(I18N.t('popup_scanning') + ` [${s + 1}/10]`, i + 1, limit)
        } else {
          UI_CONTROLLER.update(I18N.t('terminal_refining') + ` ... [${s + 1}/10]`, i + 1, limit)
        }
      }

      // После завершения под-шагов делаем "финальный прыжок" вниз для 100% срабатывания загрузчика
      const el = document.activeElement || document.body
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', code: 'End', bubbles: true }))
      setTimeout(() => el.dispatchEvent(new KeyboardEvent('keyup', { key: 'End', code: 'End', bubbles: true })), 50)

      if (foundInThisStep === 0) {
        consecutiveNoNewItems++
        await new Promise(r => setTimeout(r, 4000))
      } else {
        consecutiveNoNewItems = 0
        await new Promise(r => setTimeout(r, 800))
      }

      if (consecutiveNoNewItems >= MAX_IDLE_STEPS) break
    }

    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (scroller !== window) scroller.scrollTo({ top: 0, behavior: 'smooth' })
    await new Promise(r => setTimeout(r, 1000))
  }
};

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'ping') {
    sendResponse({ ok: true });
  } else if (msg.action === 'check_login') {
    UI_CONTROLLER.checkLogin().then(isLoggedIn => sendResponse({ isLoggedIn }));
    return true; // Async response
  } else if (msg.action === 'toggle_control_overlay') {
    UI_CONTROLLER.toggle();
    sendResponse({ ok: true }); // Send response to close channel
  }
  return false;
});

// Save metadata for testing tools
try {
  document.body.setAttribute('data-extension-id', chrome.runtime.id);
  document.body.setAttribute('data-results-url', chrome.runtime.getURL('results.html'));
} catch (e) {
  console.error('Failed to set test metadata:', e);
}

// Auto-start overlay for testing purposes if URL contains test_scan=true
if (window.location.search.includes('test_scan=true')) {
  setTimeout(() => {
    if (!UI_CONTROLLER.overlay) {
      UI_CONTROLLER.toggle();
    }
  }, 2000);
}

// --- End of Script ---
