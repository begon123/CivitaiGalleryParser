document.addEventListener('DOMContentLoaded', async () => {
  // Mock chrome API for local web server testing (to allow Kimi testing on localhost)
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    window.chrome = window.chrome || {};
    window.chrome.storage = {
      local: {
        get: async (keys) => {
          const author = 'beg0n';
          const mockData = [
            {
              src: 'https://image.civitai.com/xG1nk/1.png',
              href: 'https://civitai.com/images/122465192',
              imageId: 122465192,
              status: 'new',
              stats: { likes: 5, hearts: 2, laughs: 0, cries: 1 }
            },
            {
              src: 'https://image.civitai.com/xG1nk/2.png',
              href: 'https://civitai.com/images/122465193',
              imageId: 122465193,
              status: 'changed',
              totalDelta: 3,
              stats: { likes: 10, hearts: 5, laughs: 2, cries: 0 }
            },
            {
              src: 'https://image.civitai.com/xG1nk/3.png',
              href: 'https://civitai.com/images/122465194',
              imageId: 122465194,
              status: 'removed',
              stats: { likes: 0, hearts: 0, laughs: 0, cries: 0 }
            },
            {
              src: 'https://image.civitai.com/xG1nk/4.png',
              href: 'https://civitai.com/images/122465195',
              imageId: 122465195,
              status: 'unchanged',
              stats: { likes: 0, hearts: 0, laughs: 0, cries: 0 }
            }
          ];
          const mockPrevData = [
            {
              src: 'https://image.civitai.com/xG1nk/2.png',
              href: 'https://civitai.com/images/122465193',
              imageId: 122465193,
              status: 'unchanged',
              stats: { likes: 8, hearts: 4, laughs: 2, cries: 0 }
            },
            {
              src: 'https://image.civitai.com/xG1nk/3.png',
              href: 'https://civitai.com/images/122465194',
              imageId: 122465194,
              status: 'unchanged',
              stats: { likes: 0, hearts: 0, laughs: 0, cries: 0 }
            }
          ];
          if (typeof keys === 'string') {
            if (keys === 'civitai_gallery_author') return { civitai_gallery_author: author };
            if (keys === `civitai_gallery_data_${author}`) return { [`civitai_gallery_data_${author}`]: mockData };
            if (keys === `civitai_gallery_data_${author}_previous`) return { [`civitai_gallery_data_${author}_previous`]: mockPrevData };
          } else if (Array.isArray(keys)) {
            const res = {};
            if (keys.includes('civitai_gallery_author')) res.civitai_gallery_author = author;
            if (keys.includes(`civitai_gallery_data_${author}`)) res[`civitai_gallery_data_${author}`] = mockData;
            if (keys.includes(`civitai_gallery_data_${author}_previous`)) res[`civitai_gallery_data_${author}_previous`] = mockPrevData;
            return res;
          }
          return {};
        }
      }
    };
    window.chrome.runtime = {
      getURL: (path) => path
    };
  }

  // --- Globals ---
  let allItems = []
  let currentAuthor = 'default'
  let currentFilter = 'all'

  const gallery = document.getElementById('gallery')
  const countValue = document.getElementById('count-value')
  const countLabel = document.getElementById('count-label')
  const authorSpan = document.getElementById('authorName')
  const toggleAllReactionsBtn = document.getElementById('toggleAllReactionsBtn')
  const onlyZeroBtn = document.getElementById('onlyZeroBtn')
  let onlyZeroActive = false
  const exportBtn = document.getElementById('exportBtn')
  const importBtn = document.getElementById('importBtn')
  const closeBtn = document.getElementById('closeTab')
  const scrollTopBtn = document.getElementById('scrollTop')
  const toast = document.getElementById('toast')

  const toggleButtonSvg = {
    showReactions: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFD43B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="animate-shake"><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"/><path d="M9 10l.01 0"/><path d="M15 10l.01 0"/><path d="M9.5 15a3.5 3.5 0 0 0 5 0"/></svg>`,
    hideReactions: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"/><path d="M9 10l.01 0"/><path d="M15 10l.01 0"/><path d="M9.5 15a3.5 3.5 0 0 0 5 0"/></svg>`
  }

  // --- i18n initialization ---
  await I18N.init()
  updateAllI18nElements()

  function updateAllI18nElements() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n')
      el.textContent = I18N.t(key)
    })
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title')
      el.title = I18N.t(key)
    })
  }

  // --- Filtering Logic ---
  function applyFilters() {
    let filtered = allItems

    if (currentFilter !== 'all') {
      filtered = filtered.filter(item => item.status === currentFilter)
    }

    if (onlyZeroActive) {
      filtered = filtered.filter(item => {
        const stats = item.stats || {}
        const total = (stats.likes || 0) + (stats.hearts || 0) + (stats.laughs || 0) + (stats.cries || 0)
        return total === 0 && item.status !== 'removed'
      })
    }

    // Sort by imageId descending (newest first), items without ID go to the end
    filtered.sort((a, b) => (b.imageId || 0) - (a.imageId || 0))

    renderGallery(filtered)
  }

  // Filter Buttons - Only target those with data-filter attribute
  document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      currentFilter = btn.dataset.filter
      applyFilters()
    })
  })

  if (onlyZeroBtn) {
    onlyZeroBtn.addEventListener('click', () => {
      onlyZeroActive = !onlyZeroActive
      onlyZeroBtn.classList.toggle('active', onlyZeroActive)
      applyFilters()
    })
  }

  // --- Gallery Rendering ---
  function renderGallery(items) {
    gallery.innerHTML = ''

    // Update header counts
    const totalCurrent = allItems.filter(i => i.status !== 'removed').length
    countValue.textContent = items.length
    const labelKey = items.length === 1 ? 'results_image' : 'results_images'
    countLabel.textContent = I18N.t(labelKey)
    if (currentFilter !== 'all' || onlyZeroActive) {
      const ofLabel = I18N.t('results_of') || 'of'
      countLabel.textContent += ` (${ofLabel} ${totalCurrent})`
    }

    if (!items || items.length === 0) {
      gallery.innerHTML = `<p style="text-align:center; padding: 60px; width: 100%; color: #6b7280; grid-column: 1/-1;">${I18N.t('results_no_images')}</p>`
      return
    }

    const fragment = document.createDocumentFragment()
    const reactionsDisplayState = parseInt(localStorage.getItem('reactions_display_state') || '0', 10)

    items.forEach((item) => {
      const card = document.createElement('div')
      card.className = `card card--${item.status || 'unchanged'}`

      const stats = item.stats || {}
      const likes = stats.likes || 0
      const hearts = stats.hearts || 0
      const laughs = stats.laughs || 0
      const cries = stats.cries || 0
      const total = likes + hearts + laughs + cries

      // Create ONE block for all reactions
      let allReactionsStr = []
      if (likes > 0) allReactionsStr.push(`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="group-hover:animate-shake"><title>${I18N.t('alt_likes')}</title><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg> ${likes}`)
      if (hearts > 0) allReactionsStr.push(`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="group-hover:animate-heartbeat"><title>${I18N.t('alt_hearts')}</title><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg> ${hearts}`)
      if (laughs > 0) allReactionsStr.push(`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="group-hover:animate-shake"><title>${I18N.t('alt_laughs')}</title><circle cx="12" cy="12" r="10"/><path d="M8 9l1.5 1.5L11 9"/><path d="M13 9l1.5 1.5L16 9"/><path d="M8 14a4 4 0 0 0 8 0H8Z"/></svg> ${laughs}`)
      if (cries > 0) allReactionsStr.push(`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="group-hover:animate-bounce-subtle"><title>${I18N.t('alt_cries')}</title><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/><path d="M15 12c-.667 1-1.5 1.5-1.5 2.5a1.5 1.5 0 0 0 3 0c0-1-.833-1.5-1.5-2.5z"/></svg> ${cries}`)

      const reactionsText = allReactionsStr.join('<span style="margin: 0 4px; opacity: 0.3;">|</span>')
      const hasDelta = (item.status === 'changed' && item.totalDelta > 0)
      const labelHtml = hasDelta ? `<span class="score-label is-delta">(+${item.totalDelta})</span>` : ''
      const valClass = hasDelta ? 'score-val has-separator' : 'score-val'

      let reactionsBlockHtml = ''
      if (allReactionsStr.length > 0) {
        reactionsBlockHtml = `
            <div class="total-score reaction-badge">
              <span class="${valClass}" style="gap: 6px;">${reactionsText}</span>
              ${labelHtml}
            </div>
          `
      } else {
        reactionsBlockHtml = `
            <div class="total-score reaction-badge" style="opacity: 0.5;">
              <span class="score-val" style="padding: 0 8px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><title>${I18N.t('results_filter_zero_title')}</title><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
              </span>
            </div>
          `
      }

      // Status Badge
      let statusBadge = ''
      if (item.status === 'new') {
        statusBadge = `<div class="card-status-badge" style="background: rgba(34, 197, 94, 0.2); color: #4ade80; border-color: rgba(74, 222, 128, 0.3);">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="animate-pulse-opacity"><title>${I18N.t('status_new')}</title><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>
        </div>`
      }
      else if (item.status === 'changed') {
        statusBadge = `<div class="card-status-badge" style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; border-color: rgba(96, 165, 250, 0.3);">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="animate-spin-slow"><title>${I18N.t('status_changed')}</title><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
        </div>`
      }
      else if (item.status === 'removed') {
        statusBadge = `<div class="card-status-badge" style="background: rgba(239, 68, 68, 0.2); color: #f87171; border-color: rgba(248, 113, 113, 0.3);">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="animate-wiggle"><title>${I18N.t('status_removed')}</title><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </div>`

      }
      card.innerHTML = `
        ${statusBadge}
        <div data-href="${item.href}" class="card-link">
            <img src="${item.src}" class="card-image" alt="${I18N.t('alt_civitai_image')}" loading="lazy" />
        </div>
        <div class="card-info">
            <div class="reactions-group ${reactionsDisplayState === 1 ? 'hidden-reactions' : ''}">
                ${reactionsBlockHtml}
            </div>
            <div class="card-meta-right" style="display:flex; align-items:center;">
                <div class="total-score ${reactionsDisplayState === 0 ? 'hidden-reactions' : ''}">
                    <span class="${valClass}" style="${total === 0 ? 'color: #94a3b8;' : ''}">${total}</span>
                    ${labelHtml}
                </div>
            </div>
        </div>
      `
      fragment.appendChild(card)
    })

    gallery.appendChild(fragment)

    // Update global toggle button state
    if (toggleAllReactionsBtn) {
      toggleAllReactionsBtn.innerHTML = reactionsDisplayState === 0 ? toggleButtonSvg.showReactions : toggleButtonSvg.hideReactions
    }
  }

  // --- Global Interactions ---
  if (toggleAllReactionsBtn) {
    toggleAllReactionsBtn.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      let state = parseInt(localStorage.getItem('reactions_display_state') || '0', 10)
      state = (state + 1) % 2
      localStorage.setItem('reactions_display_state', state)

      // Toggle visibility on existing elements (Direct DOM manipulation)
      document.querySelectorAll('.reactions-group').forEach(group => group.classList.toggle('hidden-reactions', state === 1))
      document.querySelectorAll('.card-meta-right .total-score').forEach(score => score.classList.toggle('hidden-reactions', state === 0))

      // Update button icon
      toggleAllReactionsBtn.innerHTML = state === 0 ? toggleButtonSvg.showReactions : toggleButtonSvg.hideReactions
    })
  }

  function showToast(msg) {
    toast.textContent = msg
    toast.classList.add('show')
    setTimeout(() => toast.classList.remove('show'), 3000)
  }

  // --- Excel Bridge ---
  if (exportBtn) exportBtn.onclick = () => ExcelHandler.exportToExcel(allItems, currentAuthor)

  // --- Comparison Logic ---
  function getItemKey(item) {
    if (item.imageId && item.imageId > 0) {
      return `id_${item.imageId}`;
    }
    if (item.href) {
      try {
        const cleanHref = item.href.replace(/^https?:\/\/[^/]+/, '').split('?')[0];
        if (cleanHref) return `href_${cleanHref}`;
      } catch (e) {}
    }
    if (item.src) {
      try {
        let cleanSrc = item.src.split('?')[0];
        // Remove /width=.../ from the path
        cleanSrc = cleanSrc.replace(/\/width=\d+\/?/i, '/');
        return `src_${cleanSrc}`;
      } catch (e) {}
      return `src_${item.src}`;
    }
    return '';
  }

  function compareScans(currentData, previousData) {
    if (!previousData || previousData.length === 0) return currentData.map(item => ({ ...item, status: 'new' }))
    
    const prevMap = new Map()
    previousData.forEach(item => {
      const key = getItemKey(item)
      if (key) prevMap.set(key, item)
    })

    const combinedData = []

    currentData.forEach(currentItem => {
      const key = getItemKey(currentItem)
      const prevItem = key ? prevMap.get(key) : null
      
      if (prevItem) {
        const totalNow = (currentItem.stats.likes || 0) + (currentItem.stats.hearts || 0) + (currentItem.stats.laughs || 0) + (currentItem.stats.cries || 0)
        const totalBefore = (prevItem.stats.likes || 0) + (prevItem.stats.hearts || 0) + (prevItem.stats.laughs || 0) + (prevItem.stats.cries || 0)
        if (totalNow !== totalBefore) combinedData.push({ ...currentItem, status: 'changed', totalDelta: totalNow - totalBefore })
        else combinedData.push({ ...currentItem, status: 'unchanged' })
        prevMap.delete(key)
      } else {
        combinedData.push({ ...currentItem, status: 'new' })
      }
    })
    
    prevMap.forEach(removedItem => combinedData.push({ ...removedItem, status: 'removed' }))
    return combinedData
  }

  // --- Main Data Loader ---
  async function loadData() {
    const authorResult = await chrome.storage.local.get('civitai_gallery_author')
    if (authorResult.civitai_gallery_author) {
      currentAuthor = authorResult.civitai_gallery_author
      authorSpan.textContent = currentAuthor.charAt(0).toUpperCase() + currentAuthor.slice(1)

      const currentKey = `civitai_gallery_data_${currentAuthor}`
      const previousKey = `civitai_gallery_data_${currentAuthor}_previous`
      const dataResult = await chrome.storage.local.get([currentKey, previousKey])

      allItems = compareScans(dataResult[currentKey] || [], dataResult[previousKey] || [])
      applyFilters()
    }
  }

  // Initialization
  ExcelHandler.init({
    toastFn: showToast,
    i18n: I18N,
    onImportSuccess: async (data) => {
      const currentKey = `civitai_gallery_data_${data.author}`
      const storageResult = await chrome.storage.local.get(currentKey)
      const existingData = storageResult[currentKey] || []

      const previousData = (currentAuthor === data.author && allItems.length > 0) ? allItems : existingData

      if (previousData && previousData.length > 0) {
        const activePrevious = previousData.filter(item => item.status !== 'removed')
        allItems = compareScans(data.items, activePrevious)
      } else {
        allItems = data.items.map(item => ({ ...item, status: 'new' }))
      }

      currentAuthor = data.author
      authorSpan.textContent = currentAuthor.charAt(0).toUpperCase() + currentAuthor.slice(1)
      applyFilters()
    }
  })

  loadData()

  // --- Link opening logic (without showing URL in status bar) ---
  gallery.addEventListener('click', (e) => {
    const cardLink = e.target.closest('.card-link')
    if (cardLink && cardLink.dataset.href) {
      window.open(cardLink.dataset.href, '_blank')
    }
  })

  closeBtn.onclick = () => window.close()
  scrollTopBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  // Footer is configured to be always visible on screen.
})
