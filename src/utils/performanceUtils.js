/**
 * Performance optimization utilities for image processing
 */

/**
 * Debounce function to limit rapid function calls
 */
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function to limit function execution frequency
 */
export function throttle(func, limit) {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Process items in chunks to prevent UI blocking
 */
export async function processInChunks(items, processor, chunkSize = 5, onProgress) {
  const results = []
  const total = items.length
  
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize)
    
    // Process chunk in parallel
    const chunkPromises = chunk.map(async (item, index) => {
      try {
        const result = await processor(item, i + index)
        return { success: true, result, item, index: i + index }
      } catch (error) {
        return { success: false, error: error.message, item, index: i + index }
      }
    })
    
    const chunkResults = await Promise.all(chunkPromises)
    results.push(...chunkResults)
    
    // Update progress
    if (onProgress) {
      onProgress({
        completed: Math.min(i + chunkSize, total),
        total,
        percentage: Math.round((Math.min(i + chunkSize, total) / total) * 100)
      })
    }
    
    // Allow UI to update between chunks
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  
  return results
}

/**
 * Memory-efficient image processing with cleanup
 */
export class ImageProcessor {
  constructor() {
    this.activeUrls = new Set()
  }
  
  createObjectURL(blob) {
    const url = URL.createObjectURL(blob)
    this.activeUrls.add(url)
    return url
  }
  
  revokeObjectURL(url) {
    if (this.activeUrls.has(url)) {
      URL.revokeObjectURL(url)
      this.activeUrls.delete(url)
    }
  }
  
  cleanup() {
    this.activeUrls.forEach(url => URL.revokeObjectURL(url))
    this.activeUrls.clear()
  }
}

/**
 * Check if device has sufficient memory for processing
 */
export function checkMemoryCapacity(fileCount, avgFileSize) {
  // Estimate memory usage (rough calculation)
  const estimatedMemoryMB = (fileCount * avgFileSize * 3) / (1024 * 1024) // 3x for processing overhead
  
  // Check if navigator.deviceMemory is available (Chrome only)
  if ('deviceMemory' in navigator) {
    const deviceMemoryGB = navigator.deviceMemory
    const availableMemoryMB = deviceMemoryGB * 1024 * 0.5 // Use 50% of available memory
    
    return {
      canProcess: estimatedMemoryMB < availableMemoryMB,
      estimatedMemoryMB,
      availableMemoryMB,
      recommendation: estimatedMemoryMB > availableMemoryMB 
        ? 'Consider processing in smaller batches'
        : 'Memory capacity is sufficient'
    }
  }
  
  // Fallback for browsers without deviceMemory API
  const conservativeLimit = 500 // 500MB conservative limit
  return {
    canProcess: estimatedMemoryMB < conservativeLimit,
    estimatedMemoryMB,
    availableMemoryMB: conservativeLimit,
    recommendation: estimatedMemoryMB > conservativeLimit
      ? 'Consider processing in smaller batches'
      : 'Should be fine to process'
  }
}

/**
 * Optimize canvas operations for better performance
 */
export function optimizeCanvas(canvas, width, height) {
  // Set canvas size
  canvas.width = width
  canvas.height = height
  
  // Get context with optimized settings
  const ctx = canvas.getContext('2d', {
    alpha: true,
    desynchronized: true, // Better performance for animations
    willReadFrequently: false // Optimize for write operations
  })
  
  // Optimize rendering
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  
  return ctx
}

/**
 * Estimate processing time based on file size and count
 */
export function estimateProcessingTime(files, settings) {
  const totalSize = files.reduce((sum, file) => sum + file.size, 0)
  const avgFileSize = totalSize / files.length
  
  // Base processing time per MB (rough estimate)
  let timePerMB = 100 // milliseconds
  
  // Adjust based on resize algorithm
  switch (settings.algorithm) {
    case 'lanczos':
      timePerMB *= 1.5
      break
    case 'bicubic':
      timePerMB *= 1.2
      break
    case 'bilinear':
      timePerMB *= 1.0
      break
    case 'nearest':
      timePerMB *= 0.8
      break
  }
  
  // Adjust based on output format
  if (settings.format === 'image/png') {
    timePerMB *= 1.3 // PNG compression is slower
  }
  
  const totalSizeMB = totalSize / (1024 * 1024)
  const estimatedTimeMs = totalSizeMB * timePerMB
  
  return {
    estimatedTimeMs,
    estimatedTimeSeconds: Math.round(estimatedTimeMs / 1000),
    estimatedTimeFormatted: formatTime(estimatedTimeMs)
  }
}

/**
 * Format time duration for display
 */
function formatTime(ms) {
  if (ms < 1000) return `${Math.round(ms)}ms`
  if (ms < 60000) return `${Math.round(ms / 1000)}s`
  
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.round((ms % 60000) / 1000)
  return `${minutes}m ${seconds}s`
}
