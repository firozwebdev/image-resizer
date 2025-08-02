/**
 * Validation utilities for image processing
 */

export const VALIDATION_RULES = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_FILES: 100,
  MIN_DIMENSION: 1,
  MAX_DIMENSION: 8192,
  SUPPORTED_FORMATS: [
    'image/jpeg',
    'image/png', 
    'image/webp',
    'image/gif',
    'image/bmp'
  ]
}

/**
 * Validate a single file
 */
export function validateFile(file) {
  const errors = []
  
  // Check file type
  if (!VALIDATION_RULES.SUPPORTED_FORMATS.includes(file.type)) {
    errors.push(`Unsupported format: ${file.type}`)
  }
  
  // Check file size
  if (file.size > VALIDATION_RULES.MAX_FILE_SIZE) {
    errors.push(`File too large: ${formatFileSize(file.size)} (max: ${formatFileSize(VALIDATION_RULES.MAX_FILE_SIZE)})`)
  }
  
  // Check if file is empty
  if (file.size === 0) {
    errors.push('File is empty')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate multiple files
 */
export function validateFiles(files) {
  const errors = []
  const validFiles = []
  const invalidFiles = []
  
  // Check file count
  if (files.length > VALIDATION_RULES.MAX_FILES) {
    errors.push(`Too many files: ${files.length} (max: ${VALIDATION_RULES.MAX_FILES})`)
  }
  
  // Validate each file
  files.forEach((file, index) => {
    const validation = validateFile(file)
    
    if (validation.isValid) {
      validFiles.push(file)
    } else {
      invalidFiles.push({
        file,
        index,
        errors: validation.errors
      })
    }
  })
  
  return {
    isValid: errors.length === 0 && invalidFiles.length === 0,
    errors,
    validFiles,
    invalidFiles,
    summary: {
      total: files.length,
      valid: validFiles.length,
      invalid: invalidFiles.length
    }
  }
}

/**
 * Validate resize settings
 */
export function validateSettings(settings) {
  const errors = []
  
  // Check dimensions
  if (!settings.width && !settings.height) {
    errors.push('At least one dimension (width or height) must be specified')
  }
  
  if (settings.width && (settings.width < VALIDATION_RULES.MIN_DIMENSION || settings.width > VALIDATION_RULES.MAX_DIMENSION)) {
    errors.push(`Width must be between ${VALIDATION_RULES.MIN_DIMENSION} and ${VALIDATION_RULES.MAX_DIMENSION} pixels`)
  }
  
  if (settings.height && (settings.height < VALIDATION_RULES.MIN_DIMENSION || settings.height > VALIDATION_RULES.MAX_DIMENSION)) {
    errors.push(`Height must be between ${VALIDATION_RULES.MIN_DIMENSION} and ${VALIDATION_RULES.MAX_DIMENSION} pixels`)
  }
  
  // Check quality
  if (settings.quality && (settings.quality < 0.1 || settings.quality > 1)) {
    errors.push('Quality must be between 0.1 and 1.0')
  }
  
  // Check format
  if (settings.format && !VALIDATION_RULES.SUPPORTED_FORMATS.includes(settings.format)) {
    errors.push(`Unsupported output format: ${settings.format}`)
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate image metadata
 */
export function validateImageMetadata(metadata) {
  const errors = []
  
  if (!metadata.width || !metadata.height) {
    errors.push('Invalid image dimensions')
  }
  
  if (metadata.width > VALIDATION_RULES.MAX_DIMENSION || metadata.height > VALIDATION_RULES.MAX_DIMENSION) {
    errors.push(`Image dimensions too large: ${metadata.width}×${metadata.height} (max: ${VALIDATION_RULES.MAX_DIMENSION}×${VALIDATION_RULES.MAX_DIMENSION})`)
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Check browser compatibility
 */
export function checkBrowserCompatibility() {
  const features = {
    canvas: !!document.createElement('canvas').getContext,
    fileReader: !!window.FileReader,
    blob: !!window.Blob,
    url: !!window.URL,
    webp: false,
    webWorkers: !!window.Worker
  }
  
  // Check WebP support
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  features.webp = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
  
  const unsupported = Object.entries(features)
    .filter(([key, supported]) => !supported && key !== 'webp') // WebP is optional
    .map(([key]) => key)
  
  return {
    isSupported: unsupported.length === 0,
    features,
    unsupported,
    warnings: features.webp ? [] : ['WebP format not supported in this browser']
  }
}

/**
 * Format file size for display
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Sanitize filename for download
 */
export function sanitizeFilename(filename) {
  // Remove or replace invalid characters
  return filename
    .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid characters with underscore
    .replace(/\s+/g, '_') // Replace spaces with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
    .substring(0, 255) // Limit length
}

/**
 * Generate safe download filename
 */
export function generateDownloadFilename(originalName, suffix = '_resized', extension = null) {
  const baseName = originalName.replace(/\.[^/.]+$/, '') // Remove extension
  const ext = extension || originalName.split('.').pop() // Use provided extension or original
  
  return sanitizeFilename(`${baseName}${suffix}.${ext}`)
}
