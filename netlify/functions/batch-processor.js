/**
 * Netlify Function: Batch Image Processing
 * Handles multiple images with optimized server-side processing
 */

// Conditional Sharp import for development compatibility
let sharp;
try {
  sharp = require("sharp");
} catch (error) {
  console.warn("Sharp not available in development environment");
}

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle preflight requests
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const startTime = Date.now();

  try {
    // Check if Sharp is available - if not, provide client-side fallback instructions
    if (!sharp) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: false,
          fallbackToClient: true,
          error: "Server processing unavailable in development",
          message: "Please use client-side processing",
          developmentMode: true,
        }),
      };
    }

    const {
      images = [],
      options = {},
      batchId = null,
    } = JSON.parse(event.body);

    // Validate input
    if (!Array.isArray(images) || images.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "No images provided" }),
      };
    }

    // Limit batch size for serverless constraints
    const MAX_BATCH_SIZE = 10;
    if (images.length > MAX_BATCH_SIZE) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: `Batch size too large. Maximum ${MAX_BATCH_SIZE} images per batch.`,
          suggestion: "Split into smaller batches",
        }),
      };
    }

    const {
      width,
      height,
      quality = 90,
      format = "jpeg",
      algorithm = "lanczos3",
      maintainAspectRatio = true,
      backgroundColor = null,
      watermark = null,
    } = options;

    const results = [];
    const errors = [];

    // Process images in parallel with concurrency limit
    const CONCURRENCY_LIMIT = 3;
    const chunks = [];

    for (let i = 0; i < images.length; i += CONCURRENCY_LIMIT) {
      chunks.push(images.slice(i, i + CONCURRENCY_LIMIT));
    }

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (imageItem, index) => {
        try {
          const { imageData, filename, originalSize } = imageItem;

          if (!imageData) {
            throw new Error("No image data provided");
          }

          // Convert base64 to buffer
          const imageBuffer = Buffer.from(imageData.split(",")[1], "base64");

          // Get original metadata
          const originalMetadata = await sharp(imageBuffer).metadata();

          // Calculate dimensions
          let newWidth = width;
          let newHeight = height;

          if (maintainAspectRatio && width && height) {
            const aspectRatio =
              originalMetadata.width / originalMetadata.height;
            if (width / height > aspectRatio) {
              newWidth = Math.round(height * aspectRatio);
            } else {
              newHeight = Math.round(width / aspectRatio);
            }
          } else if (maintainAspectRatio) {
            if (width && !height) {
              newHeight = Math.round(
                width / (originalMetadata.width / originalMetadata.height)
              );
            } else if (height && !width) {
              newWidth = Math.round(
                height * (originalMetadata.width / originalMetadata.height)
              );
            }
          }

          // Create processing pipeline
          let pipeline = sharp(imageBuffer);

          // Apply resize
          const resizeOptions = {
            width: newWidth,
            height: newHeight,
            fit: "fill",
          };

          switch (algorithm) {
            case "lanczos":
            case "lanczos3":
              resizeOptions.kernel = sharp.kernel.lanczos3;
              break;
            case "bicubic":
              resizeOptions.kernel = sharp.kernel.cubic;
              break;
            case "bilinear":
              resizeOptions.kernel = sharp.kernel.linear;
              break;
            case "nearest":
              resizeOptions.kernel = sharp.kernel.nearest;
              break;
            default:
              resizeOptions.kernel = sharp.kernel.lanczos3;
          }

          pipeline = pipeline.resize(resizeOptions);

          // Apply background if needed
          if (backgroundColor && backgroundColor !== "transparent") {
            pipeline = pipeline.flatten({ background: backgroundColor });
          }

          // Apply watermark if specified
          if (watermark && watermark.enabled && watermark.text) {
            const watermarkSvg = createWatermarkSvg(
              watermark,
              newWidth,
              newHeight
            );
            const watermarkBuffer = Buffer.from(watermarkSvg);

            pipeline = pipeline.composite([
              {
                input: watermarkBuffer,
                gravity: getWatermarkGravity(
                  watermark.position || "bottom-right"
                ),
                blend: "over",
              },
            ]);
          }

          // Set output format
          switch (format.toLowerCase()) {
            case "jpeg":
            case "jpg":
              pipeline = pipeline.jpeg({ quality: Math.round(quality) });
              break;
            case "png":
              pipeline = pipeline.png({
                quality: Math.round(quality),
                compressionLevel: 9 - Math.round(quality / 11),
              });
              break;
            case "webp":
              pipeline = pipeline.webp({ quality: Math.round(quality) });
              break;
            default:
              pipeline = pipeline.jpeg({ quality: Math.round(quality) });
          }

          // Process image
          const processedBuffer = await pipeline.toBuffer();
          const processedMetadata = await sharp(processedBuffer).metadata();

          // Calculate metrics
          const newSize = processedBuffer.length;
          const compressionRatio = (
            ((originalSize - newSize) / originalSize) *
            100
          ).toFixed(1);

          // Convert to base64
          const processedBase64 = `data:image/${format};base64,${processedBuffer.toString(
            "base64"
          )}`;

          return {
            success: true,
            filename,
            result: {
              imageData: processedBase64,
              originalSize,
              newSize,
              originalDimensions: {
                width: originalMetadata.width,
                height: originalMetadata.height,
              },
              newDimensions: {
                width: processedMetadata.width,
                height: processedMetadata.height,
              },
              compressionRatio,
              format: processedMetadata.format,
            },
          };
        } catch (error) {
          return {
            success: false,
            filename: imageItem.filename || "unknown",
            error: error.message,
          };
        }
      });

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    }

    // Separate successful and failed results
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    const processingTime = Date.now() - startTime;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        batchId,
        results,
        summary: {
          total: images.length,
          successful: successful.length,
          failed: failed.length,
          processingTime,
        },
        performance: {
          totalProcessingTime: processingTime,
          averageTimePerImage: Math.round(processingTime / images.length),
          imagesPerSecond: (images.length / (processingTime / 1000)).toFixed(2),
        },
      }),
    };
  } catch (error) {
    console.error("Batch processing error:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || "Batch processing failed",
      }),
    };
  }
};

/**
 * Create SVG watermark
 */
function createWatermarkSvg(watermark, imageWidth, imageHeight) {
  const {
    text,
    fontSize = 24,
    color = "rgba(255,255,255,0.7)",
    opacity = 0.7,
  } = watermark;

  return `
    <svg width="${imageWidth}" height="${imageHeight}" xmlns="http://www.w3.org/2000/svg">
      <text x="50%" y="90%" 
            font-family="Arial, sans-serif" 
            font-size="${fontSize}" 
            fill="${color}" 
            opacity="${opacity}"
            text-anchor="middle" 
            dominant-baseline="middle">
        ${text}
      </text>
    </svg>
  `;
}

/**
 * Map watermark position to Sharp gravity
 */
function getWatermarkGravity(position) {
  const gravityMap = {
    "top-left": "northwest",
    "top-center": "north",
    "top-right": "northeast",
    "center-left": "west",
    center: "center",
    "center-right": "east",
    "bottom-left": "southwest",
    "bottom-center": "south",
    "bottom-right": "southeast",
  };

  return gravityMap[position] || "southeast";
}
