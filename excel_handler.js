// excel_handler.js - Handles Excel import and export logic

const ExcelHandler = {
  init({ toastFn, i18n, onImportSuccess }) {
    this.showToast = toastFn
    this.I18N = i18n
    this.onImportSuccess = onImportSuccess

    const importBtn = document.getElementById('importBtn')
    const importFileInput = document.getElementById('importFileInput')

    if (importBtn && importFileInput) {
      importBtn.addEventListener('click', () => {
        importFileInput.click()
      })

      importFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0]
        if (file) {
          this.importFromExcel(file)
          importFileInput.value = '' // Reset for re-import
        }
      })
    }
  },

  exportToExcel(allItems, currentAuthor) {
    if (typeof XLSX === 'undefined') {
      this.showToast(this.I18N.t('results_export_no_lib'))
      return
    }

    const galleryData = []
    const removedData = []

    allItems.forEach(item => {
      const stats = item.stats || {}
      const row = {
        Image_ID: item.imageId || 0,
        Image_URL: item.src,
        Post_URL: item.href,
        Likes: stats.likes || 0,
        Hearts: stats.hearts || 0,
        Laughs: stats.laughs || 0,
        Cries: stats.cries || 0,
        Total_Reactions: stats.total || 0
      }

      if (item.status === 'removed') {
        removedData.push(row)
      } else {
        let status = 0 // Unchanged
        if (item.status === 'new') status = 1
        if (item.status === 'changed') status = 2
        galleryData.push({ Status: status, ...row })
      }
    })

    const wb = XLSX.utils.book_new()
    const wsGallery = XLSX.utils.json_to_sheet(galleryData)
    XLSX.utils.book_append_sheet(wb, wsGallery, 'Gallery Data')

    if (removedData.length > 0) {
      const wsRemoved = XLSX.utils.json_to_sheet(removedData)
      XLSX.utils.book_append_sheet(wb, wsRemoved, 'Removed Data')
    }

    const isRed = allItems.some(item => item.href && item.href.includes('civitai.red'))
    const suffix = isRed ? '_red' : '_com'
    const filename = `civitai_gallery_${currentAuthor}_${new Date().toISOString().slice(0, 10)}${suffix}.xlsx`
    XLSX.writeFile(wb, filename)
    this.showToast(this.I18N.t('results_export_success'))
  },

  importFromExcel(file) {
    if (typeof XLSX === 'undefined') {
      this.showToast(this.I18N.t('results_export_no_lib'))
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })

        const importedItems = []

        const gallerySheetName = workbook.SheetNames.find(n => n.toLowerCase().includes('gallery')) || workbook.SheetNames[0]
        if (gallerySheetName) {
          const gallerySheet = workbook.Sheets[gallerySheetName]
          const galleryRows = XLSX.utils.sheet_to_json(gallerySheet)

          galleryRows.forEach(row => {
            let status = 'unchanged'
            if (row.Status === 1 || row.Status === 'new' || row.Status === 'New') status = 'new'
            else if (row.Status === 2 || row.Status === 'changed' || row.Status === 'Changed') status = 'changed'

            importedItems.push({
              src: row.Image_URL || row['Image URL'] || '',
              href: row.Post_URL || row['Post URL'] || '',
              alt: row.Alt || this.I18N.t('alt_imported'),
              imageId: parseInt(row.Image_ID || row['Image ID']) || 0,
              status: status,
              stats: {
                likes: parseInt(row.Likes) || 0,
                hearts: parseInt(row.Hearts) || 0,
                laughs: parseInt(row.Laughs) || 0,
                cries: parseInt(row.Cries) || 0,
                total: parseInt(row.Total_Reactions || row['Total Reactions']) || 0,
                collected: parseInt(row.Collected) || 0,
                comments: 0,
                downloads: 0,
                tipping: 0
              }
            })
          })
        }

        const removedSheetName = workbook.SheetNames.find(n => n.toLowerCase().includes('removed'))
        if (removedSheetName) {
          const removedSheet = workbook.Sheets[removedSheetName]
          const removedRows = XLSX.utils.sheet_to_json(removedSheet)

          removedRows.forEach(row => {
            importedItems.push({
              src: row.Image_URL || row['Image URL'] || '',
              href: row.Post_URL || row['Post URL'] || '',
              alt: row.Alt || this.I18N.t('alt_imported'),
              imageId: parseInt(row.Image_ID || row['Image ID']) || 0,
              status: 'removed',
              stats: {
                likes: parseInt(row.Likes) || 0,
                hearts: parseInt(row.Hearts) || 0,
                laughs: parseInt(row.Laughs) || 0,
                cries: parseInt(row.Cries) || 0,
                total: parseInt(row.Total_Reactions || row['Total Reactions']) || 0,
                collected: parseInt(row.Collected) || 0,
                comments: 0,
                downloads: 0,
                tipping: 0
              }
            })
          })
        }

        if (importedItems.length === 0) {
          this.showToast(this.I18N.t('results_import_no_data'))
          return
        }

        let author = 'default'
        const filenameMatch = file.name.match(/civitai_gallery_(.+?)_\d{4}/)
        if (filenameMatch) {
          author = filenameMatch[1]
        }

        this.onImportSuccess({ items: importedItems, author, filename: file.name })
        this.saveImportedToStorage(importedItems, author)
        this.showToast(this.I18N.t('results_import_success', { count: importedItems.length }))

      } catch (err) {
        console.error('Import error:', err)
        this.showToast(this.I18N.t('results_import_error', { error: err.message }))
      }
    }
    reader.readAsArrayBuffer(file)
  },

  async saveImportedToStorage(items, author) {
    try {
      const currentKey = `civitai_gallery_data_${author}`
      const previousKey = `civitai_gallery_data_${author}_previous`

      const currentItems = items
        .filter(item => item.status !== 'removed')
        .map(item => ({
          src: item.src,
          href: item.href,
          alt: item.alt,
          imageId: item.imageId || 0,
          stats: item.stats
        }))

      const result = await chrome.storage.local.get(currentKey)
      const oldData = result[currentKey] || []

      await chrome.storage.local.set({ [previousKey]: oldData })
      await chrome.storage.local.set({ [currentKey]: currentItems })
      await chrome.storage.local.set({ 'civitai_gallery_author': author })

      console.log(`Imported and saved ${currentItems.length} items for author '${author}' to storage.`)
    } catch (e) {
      console.error('Error saving imported data to storage:', e)
    }
  }
}