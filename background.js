// background.js

async function ensureContentScriptLoaded(tabId) {
  try {
    await chrome.tabs.sendMessage(tabId, { action: 'ping' });
    return true;
  } catch (error) {
    try {
      await chrome.scripting.executeScript({ target: { tabId: tabId }, files: ['i18n.js', 'content.js'] });
      await new Promise(r => setTimeout(r, 500));
      await chrome.tabs.sendMessage(tabId, { action: 'ping' });
      return true;
    } catch (injectError) {
      console.error('Script injection or retry failed', injectError);
      return false;
    }
  }
}

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url && (tab.url.includes('civitai.com') || tab.url.includes('civitai.red'))) {
    try {
      await ensureContentScriptLoaded(tab.id);
      chrome.tabs.sendMessage(tab.id, { action: 'toggle_control_overlay' });
    } catch (e) {
      console.error('Failed to toggle overlay:', e);
    }
  }
});

chrome.runtime.onMessage.addListener((request, _sender, _sendResponse) => {
  // Simple action to open the results page.
  if (request.action === 'open_results') {
    chrome.tabs.create({ url: chrome.runtime.getURL('results.html') })
    return
  }

  // Handle the 'start_scan_with_delay' action
  if (request.action === 'start_scan_with_delay') {
    const { scrollLimit, theme, lang, i18nStrings, tabId } = request;

    setTimeout(async () => {
      let targetTabId = tabId;

      if (!targetTabId) {
        const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        if (tab) targetTabId = tab.id;
      }

      if (!targetTabId) {
        console.error('Could not find a target tab for scanning.');
        return;
      }

      try {
        await ensureContentScriptLoaded(targetTabId);

        await chrome.tabs.sendMessage(targetTabId, {
          action: 'scan_images',
          scrollLimit: scrollLimit,
          theme: theme,
          lang: lang,
          i18nStrings: i18nStrings
        });
        console.log('Scan initiated from background script for tab:', targetTabId);
      } catch (error) {
        console.error('Error initiating scan from background:', error);
      }
    }, 500);
    return;
  }

  // Handle data saving, then open results page.
  if (request.action === 'save_data') {
    const author = request.author || 'default'
    const newData = request.data || []

    const currentKey = `civitai_gallery_data_${author}`
    const previousKey = `civitai_gallery_data_${author}_previous`;

    (async () => {
      try {
        const result = await chrome.storage.local.get(currentKey)
        const oldData = result[currentKey] || []

        await chrome.storage.local.set({ [previousKey]: oldData })
        console.log(`Archived ${oldData.length} items for author '${author}' to ${previousKey}`)

        await chrome.storage.local.set({ [currentKey]: newData })
        console.log(`Saved ${newData.length} new items for author '${author}' to ${currentKey}`)

        await chrome.storage.local.set({
          'civitai_gallery_author': author
        })

        chrome.tabs.create({ url: chrome.runtime.getURL('results.html') })
        _sendResponse({ success: true });
      } catch (e) {
        console.error('Error during data saving process:', e)
        chrome.tabs.create({ url: chrome.runtime.getURL('results.html') })
        _sendResponse({ success: false, error: e.message });
      }
    })();

    return true;
  }
})
