/**
 * Server-side processing service
 * Handles communication with Netlify Functions for heavy computations
 */

const API_BASE = "/.netlify/functions";

/**
 * Convert file to base64 for server transmission
 */
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Process single image on server
 */
export async function processImageOnServer(file, options = {}) {
  try {
    const imageData = await fileToBase64(file);

    const response = await fetch(`${API_BASE}/image-processor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageData,
        options,
        metadata: {
          filename: file.name,
          originalSize: file.size,
          type: file.type,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Server processing failed");
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Processing failed");
    }

    // Convert base64 back to blob
    const base64Data = result.result.imageData.split(",")[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], {
      type: `image/${options.format || "jpeg"}`,
    });

    return {
      success: true,
      result: {
        blob,
        originalSize: result.result.originalSize,
        newSize: result.result.newSize,
        originalDimensions: result.result.originalDimensions,
        newDimensions: result.result.newDimensions,
        compressionRatio: result.result.compressionRatio,
      },
    };
  } catch (error) {
    console.error("Server processing error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Process multiple images on server in batches
 */
export async function batchProcessImagesOnServer(
  files,
  options = {},
  onProgress = null
) {
  const results = [];
  const BATCH_SIZE = 10; // Server function limit

  // Split files into batches
  const batches = [];
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    batches.push(files.slice(i, i + BATCH_SIZE));
  }

  let completedFiles = 0;
  const totalFiles = files.length;

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];

    try {
      // Convert batch files to base64
      const batchData = await Promise.all(
        batch.map(async (file, index) => ({
          imageData: await fileToBase64(file),
          filename: file.name,
          originalSize: file.size,
          globalIndex: completedFiles + index,
        }))
      );

      // Send batch to server
      const response = await fetch(`${API_BASE}/batch-processor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          images: batchData,
          options,
          batchId: `batch_${batchIndex}_${Date.now()}`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Batch processing failed");
      }

      const batchResult = await response.json();

      if (!batchResult.success) {
        throw new Error(batchResult.error || "Batch processing failed");
      }

      // Process batch results
      for (const item of batchResult.results) {
        if (item.success) {
          // Convert base64 back to blob
          const base64Data = item.result.imageData.split(",")[1];
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);

          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }

          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], {
            type: `image/${options.format || "jpeg"}`,
          });

          results.push({
            success: true,
            file: batch.find((f) => f.name === item.filename),
            result: {
              blob,
              originalSize: item.result.originalSize,
              newSize: item.result.newSize,
              originalDimensions: item.result.originalDimensions,
              newDimensions: item.result.newDimensions,
              compressionRatio: item.result.compressionRatio,
            },
          });
        } else {
          results.push({
            success: false,
            file: batch.find((f) => f.name === item.filename),
            error: item.error,
          });
        }
      }

      completedFiles += batch.length;

      // Update progress
      if (onProgress) {
        onProgress({
          completed: completedFiles,
          total: totalFiles,
          percentage: Math.round((completedFiles / totalFiles) * 100),
          batchInfo: {
            currentBatch: batchIndex + 1,
            totalBatches: batches.length,
            batchSize: batch.length,
          },
        });
      }
    } catch (error) {
      console.error(`Batch ${batchIndex} processing error:`, error);

      // Add failed results for this batch
      batch.forEach((file) => {
        results.push({
          success: false,
          file,
          error: error.message,
        });
      });

      completedFiles += batch.length;

      if (onProgress) {
        onProgress({
          completed: completedFiles,
          total: totalFiles,
          percentage: Math.round((completedFiles / totalFiles) * 100),
          error: `Batch ${batchIndex + 1} failed: ${error.message}`,
        });
      }
    }

    // Small delay between batches to prevent overwhelming the server
    if (batchIndex < batches.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return results;
}

/**
 * Get advanced analytics from server
 */
export async function getAdvancedAnalytics(
  results,
  processingTime,
  analysisType = "comprehensive"
) {
  try {
    const response = await fetch(`${API_BASE}/analytics-processor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        results,
        processingTime,
        analysisType,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Analytics processing failed");
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Analytics processing failed");
    }

    return result.analytics;
  } catch (error) {
    console.error("Analytics processing error:", error);

    // Return fallback analytics
    return {
      totalFiles: results.length,
      successRate: 0,
      sizeChangeType: "unchanged",
      sizeChangeLabel: "Error",
      sizeChangeDisplay: "0 Bytes",
      sizeChangePercentage: "0.0%",
      qualityImpactText: "Error",
      qualityImpactColor: "text-red-500",
      processingTime: "0s",
      averageProcessingSpeed: "0.0",
      totalMegapixels: "0.0",
      averageCompression: "0.0",
      bestCompression: "0.0",
      formatDistribution: [],
      originalTotalSize: "0 Bytes",
      processedTotalSize: "0 Bytes",
      averageFileSize: "0 Bytes",
      memoryUsed: "0 Bytes",
      overallEfficiencyText: "Error",
      error: error.message,
    };
  }
}

/**
 * Check server availability and performance
 */
export async function checkServerHealth() {
  try {
    const startTime = Date.now();

    const response = await fetch(`${API_BASE}/image-processor`, {
      method: "OPTIONS",
    });

    const responseTime = Date.now() - startTime;

    // Check if it's a development environment error
    if (response.status === 503) {
      const errorData = await response.json().catch(() => ({}));
      if (errorData.error?.includes("development environment")) {
        return {
          available: false,
          responseTime,
          status: response.status,
          recommendation: "client",
          isDevelopment: true,
          error: "Server functions not available in development",
        };
      }
    }

    return {
      available: response.ok,
      responseTime,
      status: response.status,
      recommendation: responseTime < 1000 ? "server" : "client",
      isDevelopment: false,
    };
  } catch (error) {
    return {
      available: false,
      responseTime: -1,
      status: 0,
      recommendation: "client",
      isDevelopment: false,
      error: error.message,
    };
  }
}

/**
 * Determine optimal processing method based on conditions
 */
export async function getOptimalProcessingMethod(files, options = {}) {
  const fileCount = files.length;
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const avgFileSize = totalSize / fileCount;

  // Check server health
  const serverHealth = await checkServerHealth();

  // Decision factors
  const factors = {
    serverAvailable: serverHealth.available,
    serverResponseTime: serverHealth.responseTime,
    fileCount,
    totalSizeMB: totalSize / (1024 * 1024),
    avgFileSizeMB: avgFileSize / (1024 * 1024),
    isLargeFormat: options.format === "png" || options.algorithm === "lanczos",
    isComplexProcessing: options.watermark?.enabled || options.quality < 0.7,
  };

  // Scoring algorithm
  let serverScore = 0;
  let clientScore = 0;

  // Server advantages
  if (factors.serverAvailable) serverScore += 20;
  if (factors.serverResponseTime < 2000) serverScore += 15;
  if (factors.fileCount > 5) serverScore += 10;
  if (factors.totalSizeMB > 50) serverScore += 15;
  if (factors.avgFileSizeMB > 5) serverScore += 10;
  if (factors.isLargeFormat) serverScore += 10;
  if (factors.isComplexProcessing) serverScore += 15;

  // Client advantages
  if (!factors.serverAvailable) clientScore += 50;
  if (factors.serverResponseTime > 3000) clientScore += 20;
  if (factors.fileCount <= 3) clientScore += 15;
  if (factors.totalSizeMB < 20) clientScore += 10;
  if (factors.avgFileSizeMB < 2) clientScore += 10;

  const recommendation = serverScore > clientScore ? "server" : "client";

  return {
    recommendation,
    scores: { server: serverScore, client: clientScore },
    factors,
    reasoning: generateRecommendationReasoning(recommendation, factors),
  };
}

/**
 * Generate human-readable reasoning for processing recommendation
 */
function generateRecommendationReasoning(recommendation, factors) {
  const reasons = [];

  if (recommendation === "server") {
    if (factors.fileCount > 10)
      reasons.push("Large batch size benefits from server processing");
    if (factors.totalSizeMB > 100)
      reasons.push("Large total file size is better handled on server");
    if (factors.isComplexProcessing)
      reasons.push("Complex processing operations are optimized on server");
    if (factors.isLargeFormat)
      reasons.push(
        "High-quality formats benefit from server-side optimization"
      );
  } else {
    if (!factors.serverAvailable) reasons.push("Server is not available");
    if (factors.serverResponseTime > 3000)
      reasons.push("Server response time is too slow");
    if (factors.fileCount <= 3)
      reasons.push("Small batch size is efficient on client");
    if (factors.totalSizeMB < 20)
      reasons.push("Small file sizes can be processed locally");
  }

  return reasons.length > 0
    ? reasons.join("; ")
    : "Balanced performance characteristics";
}

/**
 * Hybrid processing service that automatically chooses optimal method
 */
export async function processImagesHybrid(
  files,
  options = {},
  onProgress = null
) {
  // Get optimal processing method
  const optimization = await getOptimalProcessingMethod(files, options);

  // Notify about processing method choice
  if (onProgress) {
    onProgress({
      completed: 0,
      total: files.length,
      percentage: 0,
      stage: `Using ${optimization.recommendation} processing`,
      reasoning: optimization.reasoning,
    });
  }

  let results;

  if (optimization.recommendation === "server") {
    try {
      results = await batchProcessImagesOnServer(files, options, onProgress);
    } catch (error) {
      console.warn("Server processing failed, falling back to client:", error);

      if (onProgress) {
        onProgress({
          completed: 0,
          total: files.length,
          percentage: 0,
          stage: "Falling back to client processing",
          warning: "Server processing failed",
        });
      }

      // Fallback to client processing
      const { batchProcessImages } = await import("../utils/imageProcessor.js");
      results = await batchProcessImages(files, options, onProgress);
    }
  } else {
    // Use client processing
    const { batchProcessImages } = await import("../utils/imageProcessor.js");
    results = await batchProcessImages(files, options, onProgress);
  }

  return {
    results,
    processingMethod: optimization.recommendation,
    optimization,
  };
}
