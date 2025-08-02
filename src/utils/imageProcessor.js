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
  "4K": { width: 3840, height: 2160, name: "4K (3840x2160)" },
};

/**
 * Calculate new dimensions while preserving aspect ratio
 */
export function calculateDimensions(
  originalWidth,
  originalHeight,
  targetWidth,
  targetHeight,
  maintainAspectRatio = true
) {
  if (!maintainAspectRatio) {
    return { width: targetWidth, height: targetHeight };
  }

  const aspectRatio = originalWidth / originalHeight;

  if (targetWidth && targetHeight) {
    // Fit within bounds
    const widthRatio = targetWidth / originalWidth;
    const heightRatio = targetHeight / originalHeight;
    const ratio = Math.min(widthRatio, heightRatio);

    return {
      width: Math.round(originalWidth * ratio),
      height: Math.round(originalHeight * ratio),
    };
  } else if (targetWidth) {
    return {
      width: targetWidth,
      height: Math.round(targetWidth / aspectRatio),
    };
  } else if (targetHeight) {
    return {
      width: Math.round(targetHeight * aspectRatio),
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
    format = file.type,
    algorithm = RESIZE_ALGORITHMS.LANCZOS,
    maintainAspectRatio = true,
    backgroundColor = "transparent",
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

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

          // Set background if needed
          if (
            format === OUTPUT_FORMATS.JPEG ||
            backgroundColor !== "transparent"
          ) {
            ctx.fillStyle =
              backgroundColor === "transparent" ? "#FFFFFF" : backgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          // Apply image smoothing based on algorithm
          applyResizeAlgorithm(ctx, algorithm);

          // Draw the resized image
          ctx.drawImage(img, 0, 0, newDimensions.width, newDimensions.height);

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
            format,
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
 * Format file size for display
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
