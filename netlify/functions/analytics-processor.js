/**
 * Netlify Function: Advanced Analytics Processing
 * Handles complex statistics calculations on the server
 */

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const startTime = Date.now();

  try {
    const { 
      results = [], 
      processingTime = 0,
      analysisType = 'comprehensive'
    } = JSON.parse(event.body);

    // Validate input
    if (!Array.isArray(results)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid results data' })
      };
    }

    const successful = results.filter(r => r.success && r.result);
    const failed = results.filter(r => !r.success);

    if (successful.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          analytics: getEmptyAnalytics(),
          processingTime: Date.now() - startTime
        })
      };
    }

    // Perform comprehensive analytics calculations
    const analytics = await calculateComprehensiveAnalytics(successful, failed, processingTime);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        analytics,
        processingTime: Date.now() - startTime,
        metadata: {
          totalResults: results.length,
          successfulResults: successful.length,
          failedResults: failed.length,
          analysisType
        }
      })
    };

  } catch (error) {
    console.error('Analytics processing error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Analytics processing failed'
      })
    };
  }
};

/**
 * Calculate comprehensive analytics
 */
async function calculateComprehensiveAnalytics(successful, failed, processingTime) {
  // Basic metrics
  const totalFiles = successful.length + failed.length;
  const successRate = Math.round((successful.length / totalFiles) * 100);

  // Size calculations with error handling
  const totalOriginalSize = successful.reduce((sum, r) => {
    const size = r.result?.originalSize || 0;
    return sum + (isNaN(size) ? 0 : size);
  }, 0);

  const totalProcessedSize = successful.reduce((sum, r) => {
    const size = r.result?.newSize || 0;
    return sum + (isNaN(size) ? 0 : size);
  }, 0);

  const totalSizeSaved = totalOriginalSize - totalProcessedSize;

  // Compression analysis
  const compressionRatios = successful
    .map(r => parseFloat(r.result?.compressionRatio || 0))
    .filter(ratio => !isNaN(ratio));

  const averageCompression = compressionRatios.length > 0
    ? (compressionRatios.reduce((sum, ratio) => sum + ratio, 0) / compressionRatios.length).toFixed(1)
    : '0.0';

  const bestCompression = compressionRatios.length > 0
    ? Math.max(...compressionRatios).toFixed(1)
    : '0.0';

  const worstCompression = compressionRatios.length > 0
    ? Math.min(...compressionRatios).toFixed(1)
    : '0.0';

  // Format distribution analysis
  const formatCounts = {};
  successful.forEach(r => {
    const format = r.result?.blob?.type?.split('/')[1]?.toUpperCase() || 'UNKNOWN';
    formatCounts[format] = (formatCounts[format] || 0) + 1;
  });

  const formatDistribution = Object.entries(formatCounts).map(([type, count]) => ({
    type,
    count,
    percentage: Math.round((count / successful.length) * 100)
  }));

  // Performance metrics
  const processingTimeSeconds = Math.max(0, processingTime / 1000);
  const averageProcessingSpeed = processingTimeSeconds > 0 && successful.length > 0
    ? (successful.length / processingTimeSeconds).toFixed(1)
    : '0.0';

  // Megapixel calculations
  const totalMegapixels = successful.reduce((sum, r) => {
    const width = r.result?.originalDimensions?.width || 0;
    const height = r.result?.originalDimensions?.height || 0;
    const mp = (width * height) / 1000000;
    return sum + (isNaN(mp) ? 0 : mp);
  }, 0).toFixed(1);

  const megapixelThroughput = processingTimeSeconds > 0
    ? (parseFloat(totalMegapixels) / processingTimeSeconds).toFixed(1)
    : '0.0';

  // Size change analysis
  const sizeChangePercentage = totalOriginalSize > 0
    ? ((totalSizeSaved / totalOriginalSize) * 100).toFixed(1)
    : '0.0';

  const absoluteSizeChangePercentage = Math.abs(parseFloat(sizeChangePercentage));

  // Determine size change type and metrics
  let sizeChangeType, sizeChangeLabel, sizeChangeDisplay;
  
  if (totalSizeSaved > 0) {
    sizeChangeType = 'reduced';
    sizeChangeLabel = 'Size Reduced';
    sizeChangeDisplay = `-${formatFileSize(totalSizeSaved)}`;
  } else if (totalSizeSaved < 0) {
    sizeChangeType = 'increased';
    sizeChangeLabel = 'Size Increased';
    sizeChangeDisplay = `+${formatFileSize(Math.abs(totalSizeSaved))}`;
  } else {
    sizeChangeType = 'unchanged';
    sizeChangeLabel = 'Size Unchanged';
    sizeChangeDisplay = formatFileSize(0);
  }

  const sizeChangePercentageDisplay = totalSizeSaved >= 0
    ? `-${absoluteSizeChangePercentage}%`
    : `+${absoluteSizeChangePercentage}%`;

  // Quality impact analysis
  let qualityImpactText, qualityImpactColor;
  
  if (sizeChangeType === 'increased') {
    if (absoluteSizeChangePercentage > 50) {
      qualityImpactText = 'High Quality';
      qualityImpactColor = 'text-blue-600 dark:text-blue-400';
    } else if (absoluteSizeChangePercentage > 20) {
      qualityImpactText = 'Enhanced Quality';
      qualityImpactColor = 'text-indigo-600 dark:text-indigo-400';
    } else {
      qualityImpactText = 'Quality Preserved';
      qualityImpactColor = 'text-purple-600 dark:text-purple-400';
    }
  } else if (sizeChangeType === 'reduced') {
    if (absoluteSizeChangePercentage > 70) {
      qualityImpactText = 'Aggressive Compression';
      qualityImpactColor = 'text-orange-600 dark:text-orange-400';
    } else if (absoluteSizeChangePercentage > 40) {
      qualityImpactText = 'Good Compression';
      qualityImpactColor = 'text-green-600 dark:text-green-400';
    } else if (absoluteSizeChangePercentage > 10) {
      qualityImpactText = 'Mild Compression';
      qualityImpactColor = 'text-emerald-600 dark:text-emerald-400';
    } else {
      qualityImpactText = 'Minimal Change';
      qualityImpactColor = 'text-gray-600 dark:text-gray-400';
    }
  } else {
    qualityImpactText = 'No Change';
    qualityImpactColor = 'text-gray-600 dark:text-gray-400';
  }

  // Efficiency scoring
  const speedScore = parseFloat(averageProcessingSpeed) > 1 ? 3 : 
                    parseFloat(averageProcessingSpeed) > 0.5 ? 2 : 1;
  const sizeScore = sizeChangeType === 'reduced' ? 3 : 
                   sizeChangeType === 'increased' ? 2 : 1;
  const memoryScore = totalOriginalSize < 50 * 1024 * 1024 ? 3 : 
                     totalOriginalSize < 200 * 1024 * 1024 ? 2 : 1;
  const totalScore = speedScore + sizeScore + memoryScore;

  const overallEfficiencyText = totalScore >= 8 ? 'Excellent' : 
                               totalScore >= 6 ? 'Good' : 
                               totalScore >= 4 ? 'Fair' : 'Poor';

  // Advanced analytics
  const advancedMetrics = {
    compressionEfficiency: calculateCompressionEfficiency(compressionRatios),
    processingConsistency: calculateProcessingConsistency(successful),
    formatOptimization: analyzeFormatOptimization(formatDistribution),
    resourceUtilization: calculateResourceUtilization(totalOriginalSize, processingTimeSeconds),
    qualityPreservation: calculateQualityPreservation(successful),
    batchEfficiency: calculateBatchEfficiency(successful.length, processingTimeSeconds)
  };

  return {
    // Basic metrics
    totalFiles,
    successRate,
    
    // Size metrics
    sizeChangeType,
    sizeChangeLabel,
    sizeChangeDisplay,
    sizeChangePercentage: sizeChangePercentageDisplay,
    
    // Quality metrics
    qualityImpactText,
    qualityImpactColor,
    
    // Performance metrics
    processingTime: formatProcessingTime(processingTimeSeconds),
    averageProcessingSpeed,
    totalMegapixels,
    megapixelThroughput,
    
    // Compression metrics
    averageCompression,
    bestCompression,
    worstCompression,
    
    // Distribution
    formatDistribution,
    
    // File sizes
    originalTotalSize: formatFileSize(totalOriginalSize),
    processedTotalSize: formatFileSize(totalProcessedSize),
    averageFileSize: successful.length > 0 ? formatFileSize(totalOriginalSize / successful.length) : formatFileSize(0),
    memoryUsed: formatFileSize(totalOriginalSize * 2),
    
    // Efficiency
    overallEfficiencyText,
    
    // Advanced metrics
    advanced: advancedMetrics
  };
}

/**
 * Helper functions for advanced calculations
 */
function calculateCompressionEfficiency(ratios) {
  if (ratios.length === 0) return 0;
  const variance = calculateVariance(ratios);
  return Math.max(0, 100 - variance).toFixed(1);
}

function calculateProcessingConsistency(results) {
  const times = results.map(r => r.processingTime || 0).filter(t => t > 0);
  if (times.length === 0) return 100;
  const variance = calculateVariance(times);
  return Math.max(0, 100 - (variance / 1000)).toFixed(1);
}

function calculateVariance(numbers) {
  const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
  return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
}

function analyzeFormatOptimization(distribution) {
  // Simple optimization score based on format efficiency
  let score = 0;
  distribution.forEach(format => {
    if (format.type === 'WEBP') score += format.percentage * 1.5;
    else if (format.type === 'JPEG') score += format.percentage * 1.2;
    else if (format.type === 'PNG') score += format.percentage * 1.0;
    else score += format.percentage * 0.8;
  });
  return Math.min(100, score).toFixed(1);
}

function calculateResourceUtilization(totalSize, timeSeconds) {
  const sizeMB = totalSize / (1024 * 1024);
  const throughputMBps = timeSeconds > 0 ? sizeMB / timeSeconds : 0;
  return Math.min(100, throughputMBps * 10).toFixed(1);
}

function calculateQualityPreservation(results) {
  // Estimate quality preservation based on compression ratios
  const avgCompression = results.reduce((sum, r) => {
    const ratio = parseFloat(r.result?.compressionRatio || 0);
    return sum + (isNaN(ratio) ? 0 : Math.abs(ratio));
  }, 0) / results.length;
  
  return Math.max(0, 100 - avgCompression).toFixed(1);
}

function calculateBatchEfficiency(count, timeSeconds) {
  const imagesPerSecond = timeSeconds > 0 ? count / timeSeconds : 0;
  return Math.min(100, imagesPerSecond * 20).toFixed(1);
}

function formatFileSize(bytes) {
  if (bytes == null || isNaN(bytes) || bytes < 0) return "0 Bytes";
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const sizeIndex = Math.min(i, sizes.length - 1);
  
  return parseFloat((bytes / Math.pow(k, sizeIndex)).toFixed(2)) + " " + sizes[sizeIndex];
}

function formatProcessingTime(seconds) {
  return seconds > 60 
    ? `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`
    : `${Math.floor(seconds)}s`;
}

function getEmptyAnalytics() {
  return {
    totalFiles: 0,
    successRate: 0,
    sizeChangeType: 'unchanged',
    sizeChangeLabel: 'No Data',
    sizeChangeDisplay: '0 Bytes',
    sizeChangePercentage: '0.0%',
    qualityImpactText: 'No Data',
    qualityImpactColor: 'text-gray-500',
    processingTime: '0s',
    averageProcessingSpeed: '0.0',
    totalMegapixels: '0.0',
    megapixelThroughput: '0.0',
    averageCompression: '0.0',
    bestCompression: '0.0',
    worstCompression: '0.0',
    formatDistribution: [],
    originalTotalSize: '0 Bytes',
    processedTotalSize: '0 Bytes',
    averageFileSize: '0 Bytes',
    memoryUsed: '0 Bytes',
    overallEfficiencyText: 'No Data',
    advanced: {
      compressionEfficiency: '0.0',
      processingConsistency: '0.0',
      formatOptimization: '0.0',
      resourceUtilization: '0.0',
      qualityPreservation: '0.0',
      batchEfficiency: '0.0'
    }
  };
}
