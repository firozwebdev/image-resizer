/**
 * Netlify Function: Advanced Image Processing
 * Handles heavy image processing operations on the server
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

    const { imageData, options = {}, metadata = {} } = JSON.parse(event.body);

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

    // Validate input
    if (!imageData) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "No image data provided" }),
      };
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageData.split(",")[1], "base64");

    // Get original image metadata
    const originalMetadata = await sharp(imageBuffer).metadata();

    // Calculate new dimensions
    let newWidth = width;
    let newHeight = height;

    if (maintainAspectRatio && width && height) {
      const aspectRatio = originalMetadata.width / originalMetadata.height;
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

    // Create Sharp processing pipeline
    let pipeline = sharp(imageBuffer);

    // Apply resize with specified algorithm
    const resizeOptions = {
      width: newWidth,
      height: newHeight,
      fit: "fill",
    };

    // Map algorithm names to Sharp kernels
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

    // Apply background color if specified
    if (backgroundColor && backgroundColor !== "transparent") {
      pipeline = pipeline.flatten({ background: backgroundColor });
    }

    // Apply watermark if specified
    if (watermark && watermark.enabled && watermark.text) {
      const watermarkSvg = createWatermarkSvg(watermark, newWidth, newHeight);
      const watermarkBuffer = Buffer.from(watermarkSvg);

      pipeline = pipeline.composite([
        {
          input: watermarkBuffer,
          gravity: getWatermarkGravity(watermark.position || "bottom-right"),
          blend: "over",
        },
      ]);
    }

    // Set output format and quality
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

    // Process the image
    const processedBuffer = await pipeline.toBuffer();
    const processedMetadata = await sharp(processedBuffer).metadata();

    // Calculate compression ratio
    const originalSize = imageBuffer.length;
    const newSize = processedBuffer.length;
    const compressionRatio = (
      ((originalSize - newSize) / originalSize) *
      100
    ).toFixed(1);

    // Convert processed image back to base64
    const processedBase64 = `data:image/${format};base64,${processedBuffer.toString(
      "base64"
    )}`;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
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
          processingTime: Date.now() - startTime,
        },
      }),
    };
  } catch (error) {
    console.error("Image processing error:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || "Image processing failed",
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
