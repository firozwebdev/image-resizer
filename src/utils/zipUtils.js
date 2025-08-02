import JSZip from 'jszip'
import { saveAs } from 'file-saver'

/**
 * Create and download a ZIP file containing processed images
 */
export async function downloadAsZip(processedImages, filename = 'resized-images.zip', onProgress) {
  const zip = new JSZip()
  const total = processedImages.length
  
  for (let i = 0; i < processedImages.length; i++) {
    const item = processedImages[i]
    
    if (item.success && item.result) {
      const { file, result } = item
      const extension = getFileExtension(result.blob.type)
      const baseName = file.name.replace(/\.[^/.]+$/, '')
      const newFileName = `${baseName}_resized${extension}`
      
      zip.file(newFileName, result.blob)
    }
    
    if (onProgress) {
      onProgress({
        completed: i + 1,
        total,
        percentage: Math.round(((i + 1) / total) * 100),
        stage: 'Adding to ZIP'
      })
    }
  }
  
  try {
    const content = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    }, (metadata) => {
      if (onProgress) {
        onProgress({
          completed: metadata.percent,
          total: 100,
          percentage: Math.round(metadata.percent),
          stage: 'Generating ZIP'
        })
      }
    })
    
    saveAs(content, filename)
    return true
  } catch (error) {
    console.error('Error creating ZIP:', error)
    throw new Error('Failed to create ZIP file')
  }
}

/**
 * Get file extension from MIME type
 */
function getFileExtension(mimeType) {
  const extensions = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/bmp': '.bmp'
  }
  
  return extensions[mimeType] || '.jpg'
}

/**
 * Download individual image
 */
export function downloadImage(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Create a preview URL for an image blob
 */
export function createPreviewUrl(blob) {
  return URL.createObjectURL(blob)
}

/**
 * Cleanup preview URLs to prevent memory leaks
 */
export function cleanupPreviewUrls(urls) {
  urls.forEach(url => {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url)
    }
  })
}
