/**
 * Advanced Image Processing Utilities
 * Supports multiple resize algorithms, format conversion, and quality controls
 */

export const RESIZE_ALGORITHMS = {
  LANCZOS: "lanczos",
  BICUBIC: "bicubic",
  BILINEAR: "bilinear",
  NEAREST: "nearest",
};

export const OUTPUT_FORMATS = {
  JPEG: "image/jpeg",
  PNG: "image/png",
  WEBP: "image/webp",
};

export const PRESET_SIZES = {
  THUMBNAIL: { width: 150, height: 150, name: "Thumbnail" },
  SMALL: { width: 400, height: 400, name: "Small" },
  MEDIUM: { width: 800, height: 800, name: "Medium" },
  LARGE: { width: 1200, height: 1200, name: "Large" },
  HD: { width: 1920, height: 1080, name: "HD (1920x1080)" },
  "4K": { width: 4500, height: 5400, name: "4K (4500x5400)" },
};

/**
 * Calculate new dimensions based on user requirements
 * When both width and height are specified, uses exact dimensions (may change aspect ratio)
 * When only one dimension is specified, calculates the other based on aspect ratio
 */
export function calculateDimensions(
  originalWidth,
  originalHeight,
  targetWidth,
  targetHeight,
  maintainAspectRatio = true
) {
  // If both width and height are specified, use exact dimensions
  // This ensures the image is resized to exactly what the user requested
  if (targetWidth && targetHeight) {
    return { width: targetWidth, height: targetHeight };
  }

  // If only one dimension is specified, calculate the other based on aspect ratio
  const aspectRatio = originalWidth / originalHeight;

  if (targetWidth) {
    return {
      width: targetWidth,
      height: maintainAspectRatio
        ? Math.round(targetWidth / aspectRatio)
        : targetHeight || originalHeight,
    };
  } else if (targetHeight) {
    return {
      width: maintainAspectRatio
        ? Math.round(targetHeight * aspectRatio)
        : targetWidth || originalWidth,
      height: targetHeight,
    };
  }

  return { width: originalWidth, height: originalHeight };
}

/**
 * Advanced image resizing with multiple algorithms
 */
export function resizeImage(file, options = {}) {
  const {
    width,
    height,
    quality = 0.9,
    format = file.type, // Use original format if not specified
    algorithm = RESIZE_ALGORITHMS.LANCZOS,
    maintainAspectRatio = true,
    backgroundColor = "transparent",
  } = options;

  // If format is null, use the original file format
  const outputFormat = format || file.type;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          // Ensure alpha channel is preserved for transparency
          const ctx = canvas.getContext("2d", { alpha: true });

          // Calculate new dimensions
          const newDimensions = calculateDimensions(
            img.width,
            img.height,
            width,
            height,
            maintainAspectRatio
          );

          canvas.width = newDimensions.width;
          canvas.height = newDimensions.height;

          // Only set background for JPEG or when user explicitly sets a background color
          // PNG and WebP preserve transparency by default
          const shouldFillBackground =
            outputFormat === OUTPUT_FORMATS.JPEG ||
            (backgroundColor && backgroundColor !== "transparent");

          if (shouldFillBackground) {
            ctx.fillStyle =
              backgroundColor === "transparent" ? "#FFFFFF" : backgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          // For PNG/WebP with transparent/no background, canvas remains transparent

          // Apply image smoothing based on algorithm
          applyResizeAlgorithm(ctx, algorithm);

          // Draw the resized image
          ctx.drawImage(img, 0, 0, newDimensions.width, newDimensions.height);

          // Apply watermark if enabled
          if (
            options.watermark &&
            options.watermark.enabled &&
            options.watermark.text
          ) {
            applyWatermark(ctx, newDimensions, options.watermark);
          }

          // Convert to blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve({
                  blob,
                  originalSize: file.size,
                  newSize: blob.size,
                  originalDimensions: { width: img.width, height: img.height },
                  newDimensions,
                  compressionRatio: (
                    ((file.size - blob.size) / file.size) *
                    100
                  ).toFixed(1),
                });
              } else {
                reject(new Error("Failed to create blob"));
              }
            },
            outputFormat,
            quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Apply different resize algorithms
 */
function applyResizeAlgorithm(ctx, algorithm) {
  switch (algorithm) {
    case RESIZE_ALGORITHMS.NEAREST:
      ctx.imageSmoothingEnabled = false;
      break;
    case RESIZE_ALGORITHMS.BILINEAR:
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "low";
      break;
    case RESIZE_ALGORITHMS.BICUBIC:
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "medium";
      break;
    case RESIZE_ALGORITHMS.LANCZOS:
    default:
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      break;
  }
}

/**
 * Batch process multiple images with chunked processing for better performance
 */
export async function batchProcessImages(files, options, onProgress) {
  const results = [];
  const total = files.length;
  const chunkSize = Math.min(10, Math.max(1, Math.floor(1000 / files.length))); // Dynamic chunk size

  for (let i = 0; i < files.length; i += chunkSize) {
    const chunk = files.slice(i, i + chunkSize);

    // Process chunk in parallel for better performance
    const chunkPromises = chunk.map(async (file, chunkIndex) => {
      const globalIndex = i + chunkIndex;
      try {
        const result = await resizeImage(file, options);
        return {
          success: true,
          file,
          result,
          index: globalIndex,
        };
      } catch (error) {
        return {
          success: false,
          file,
          error: error.message,
          index: globalIndex,
        };
      }
    });

    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);

    // Update progress after each chunk
    if (onProgress) {
      const completed = Math.min(i + chunkSize, total);
      onProgress({
        completed,
        total,
        percentage: Math.round((completed / total) * 100),
        currentFile: chunk[chunk.length - 1].name,
      });
    }

    // Allow UI to breathe between chunks
    if (i + chunkSize < files.length) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  return results;
}

/**
 * Get image metadata
 */
export function getImageMetadata(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        resolve({
          name: file.name,
          size: file.size,
          type: file.type,
          width: img.width,
          height: img.height,
          aspectRatio: img.width / img.height,
          megapixels: ((img.width * img.height) / 1000000).toFixed(2),
        });
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Apply watermark to canvas
 */
function applyWatermark(ctx, dimensions, watermark) {
  const { text, position = "bottom-right", opacity = 0.7 } = watermark;

  // Save current context state
  ctx.save();

  // Set watermark style
  const fontSize = Math.max(
    16,
    Math.min(dimensions.width, dimensions.height) * 0.03
  );
  ctx.font = `${fontSize}px Arial, sans-serif`;
  ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
  ctx.strokeStyle = `rgba(0, 0, 0, ${opacity * 0.5})`;
  ctx.lineWidth = 2;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  // Measure text
  const textMetrics = ctx.measureText(text);
  const textWidth = textMetrics.width;
  const textHeight = fontSize;

  // Calculate position
  let x, y;
  const padding = Math.max(10, fontSize * 0.5);

  switch (position) {
    case "top-left":
      x = padding;
      y = padding;
      break;
    case "top-right":
      x = dimensions.width - textWidth - padding;
      y = padding;
      break;
    case "bottom-left":
      x = padding;
      y = dimensions.height - textHeight - padding;
      break;
    case "bottom-right":
      x = dimensions.width - textWidth - padding;
      y = dimensions.height - textHeight - padding;
      break;
    case "center":
      x = (dimensions.width - textWidth) / 2;
      y = (dimensions.height - textHeight) / 2;
      break;
    default:
      x = dimensions.width - textWidth - padding;
      y = dimensions.height - textHeight - padding;
  }

  // Draw text with stroke for better visibility
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);

  // Restore context state
  ctx.restore();
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes) {
  // Handle invalid inputs
  if (bytes == null || isNaN(bytes) || bytes < 0) {
    return "0 Bytes";
  }

  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  // Ensure i is within bounds
  const sizeIndex = Math.min(i, sizes.length - 1);

  return (
    parseFloat((bytes / Math.pow(k, sizeIndex)).toFixed(2)) +
    " " +
    sizes[sizeIndex]
  );
}
