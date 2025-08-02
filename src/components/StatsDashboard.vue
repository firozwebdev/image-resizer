<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">
      Processing Statistics
    </h3>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Total Files -->
      <div class="text-center">
        <div
          class="p-4 bg-blue-100 dark:bg-blue-900/20 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center"
        >
          <PhotoIcon class="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <div class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ stats.totalFiles }}
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400">Total Files</div>
      </div>

      <!-- Success Rate -->
      <div class="text-center">
        <div
          class="p-4 bg-green-100 dark:bg-green-900/20 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center"
        >
          <CheckCircleIcon class="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <div class="text-2xl font-bold text-green-600 dark:text-green-400">
          {{ stats.successRate }}%
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400">Success Rate</div>
      </div>

      <!-- Size Change Analysis -->
      <div class="text-center">
        <div
          :class="[
            'p-4 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center',
            stats.sizeChangeType === 'reduced'
              ? 'bg-green-100 dark:bg-green-900/20'
              : stats.sizeChangeType === 'increased'
              ? 'bg-red-100 dark:bg-red-900/20'
              : 'bg-gray-100 dark:bg-gray-900/20',
          ]"
        >
          <component
            :is="stats.sizeChangeIcon"
            :class="[
              'w-8 h-8',
              stats.sizeChangeType === 'reduced'
                ? 'text-green-600 dark:text-green-400'
                : stats.sizeChangeType === 'increased'
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-600 dark:text-gray-400',
            ]"
          />
        </div>
        <div
          :class="[
            'text-2xl font-bold',
            stats.sizeChangeType === 'reduced'
              ? 'text-green-600 dark:text-green-400'
              : stats.sizeChangeType === 'increased'
              ? 'text-red-600 dark:text-red-400'
              : 'text-gray-600 dark:text-gray-400',
          ]"
        >
          {{ stats.sizeChangeDisplay }}
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ stats.sizeChangeLabel }}
        </div>
        <div class="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {{ stats.sizeChangePercentage }}
        </div>
      </div>

      <!-- Processing Time -->
      <div class="text-center">
        <div
          class="p-4 bg-orange-100 dark:bg-orange-900/20 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center"
        >
          <ClockIcon class="w-8 h-8 text-orange-600 dark:text-orange-400" />
        </div>
        <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">
          {{ stats.processingTime }}
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Processing Time
        </div>
      </div>
    </div>

    <!-- Detailed Breakdown -->
    <div class="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Format Distribution -->
      <div>
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
          Output Format Distribution
        </h4>
        <div class="space-y-3">
          <div
            v-for="format in stats.formatDistribution"
            :key="format.type"
            class="flex items-center justify-between"
          >
            <div class="flex items-center space-x-2">
              <div
                :class="[
                  'w-3 h-3 rounded-full',
                  format.type === 'JPEG'
                    ? 'bg-blue-500'
                    : format.type === 'PNG'
                    ? 'bg-green-500'
                    : format.type === 'WebP'
                    ? 'bg-purple-500'
                    : 'bg-gray-500',
                ]"
              ></div>
              <span class="text-sm text-gray-700 dark:text-gray-300">{{
                format.type
              }}</span>
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-sm font-medium text-gray-900 dark:text-white">{{
                format.count
              }}</span>
              <span class="text-xs text-gray-500 dark:text-gray-400"
                >({{ format.percentage }}%)</span
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Size Reduction -->
      <div>
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
          Size Reduction Analysis
        </h4>
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-700 dark:text-gray-300"
              >Original Total Size</span
            >
            <span class="text-sm font-medium text-gray-900 dark:text-white">{{
              stats.originalTotalSize
            }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-700 dark:text-gray-300"
              >Processed Total Size</span
            >
            <span class="text-sm font-medium text-gray-900 dark:text-white">{{
              stats.processedTotalSize
            }}</span>
          </div>

          <!-- Enhanced Size Change Indicator -->
          <div
            class="flex items-center justify-between p-2 rounded-lg"
            :class="
              stats.sizeChangeType === 'reduced'
                ? 'bg-green-50 dark:bg-green-900/10'
                : stats.sizeChangeType === 'increased'
                ? 'bg-red-50 dark:bg-red-900/10'
                : 'bg-gray-50 dark:bg-gray-900/10'
            "
          >
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
              Net Size Change
            </span>
            <div class="text-right">
              <span
                :class="[
                  'text-sm font-bold',
                  stats.sizeChangeType === 'reduced'
                    ? 'text-green-600 dark:text-green-400'
                    : stats.sizeChangeType === 'increased'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-600 dark:text-gray-400',
                ]"
              >
                {{ stats.sizeChangeDisplay }}
              </span>
              <div
                :class="[
                  'text-xs',
                  stats.sizeChangeType === 'reduced'
                    ? 'text-green-500 dark:text-green-500'
                    : stats.sizeChangeType === 'increased'
                    ? 'text-red-500 dark:text-red-500'
                    : 'text-gray-500 dark:text-gray-500',
                ]"
              >
                {{ stats.sizeChangePercentage }}
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-700 dark:text-gray-300"
              >Average Compression</span
            >
            <span
              :class="[
                'text-sm font-medium',
                parseFloat(stats.averageCompression) >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400',
              ]"
              >{{ stats.averageCompression }}%</span
            >
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-700 dark:text-gray-300"
              >Best Compression</span
            >
            <span
              :class="[
                'text-sm font-medium',
                parseFloat(stats.bestCompression) >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400',
              ]"
              >{{ stats.bestCompression }}%</span
            >
          </div>

          <!-- Quality vs Size Trade-off Indicator -->
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-700 dark:text-gray-300">
              Quality Impact
            </span>
            <span class="text-sm font-medium" :class="stats.qualityImpactColor">
              {{ stats.qualityImpactText }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Performance Metrics -->
    <div class="mt-8 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Performance Metrics
      </h4>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
        <div>
          <div class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ stats.averageProcessingSpeed }}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">Images/sec</div>
          <div class="text-xs" :class="stats.speedEfficiencyColor">
            {{ stats.speedEfficiencyText }}
          </div>
        </div>
        <div>
          <div class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ stats.totalMegapixels }}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">Total MP</div>
          <div class="text-xs text-blue-500 dark:text-blue-400">
            {{ stats.megapixelEfficiency }}
          </div>
        </div>
        <div>
          <div class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ stats.averageFileSize }}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">Avg Size</div>
          <div class="text-xs" :class="stats.sizeEfficiencyColor">
            {{ stats.sizeEfficiencyText }}
          </div>
        </div>
        <div>
          <div class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ stats.memoryUsed }}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">
            Memory Used
          </div>
          <div class="text-xs" :class="stats.memoryEfficiencyColor">
            {{ stats.memoryEfficiencyText }}
          </div>
        </div>
      </div>

      <!-- Processing Efficiency Summary -->
      <div class="mt-4 p-3 rounded-lg" :class="stats.overallEfficiencyBg">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Overall Efficiency
          </span>
          <span class="text-sm font-bold" :class="stats.overallEfficiencyColor">
            {{ stats.overallEfficiencyText }}
          </span>
        </div>
        <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">
          {{ stats.efficiencyDescription }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import {
  PhotoIcon,
  CheckCircleIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  ClockIcon,
  ScaleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/vue/24/outline";
import { formatFileSize } from "../utils/imageProcessor.js";

const props = defineProps({
  results: {
    type: Array,
    default: () => [],
  },
  processingTime: {
    type: Number,
    default: 0,
  },
});

const stats = computed(() => {
  const successful = props.results.filter((r) => r.success && r.result);
  const failed = props.results.filter((r) => !r.success);

  if (successful.length === 0) {
    return {
      totalFiles: 0,
      successRate: 0,
      totalSizeSaved: "0 B",
      processingTime: "0s",
      formatDistribution: [],
      originalTotalSize: "0 B",
      processedTotalSize: "0 B",
      averageCompression: 0,
      bestCompression: 0,
      averageProcessingSpeed: 0,
      totalMegapixels: 0,
      averageFileSize: "0 B",
      memoryUsed: "0 MB",
    };
  }

  const totalOriginalSize = successful.reduce((sum, r) => {
    const size = r.result?.originalSize || 0;
    return sum + (isNaN(size) ? 0 : size);
  }, 0);

  const totalProcessedSize = successful.reduce((sum, r) => {
    const size = r.result?.newSize || 0;
    return sum + (isNaN(size) ? 0 : size);
  }, 0);

  const totalSizeSaved = totalOriginalSize - totalProcessedSize;

  const compressionRatios = successful
    .map((r) => parseFloat(r.result?.compressionRatio || 0))
    .filter((ratio) => !isNaN(ratio));

  const averageCompression =
    compressionRatios.length > 0
      ? (
          compressionRatios.reduce((sum, ratio) => sum + ratio, 0) /
          compressionRatios.length
        ).toFixed(1)
      : "0.0";

  const bestCompression =
    compressionRatios.length > 0
      ? Math.max(...compressionRatios).toFixed(1)
      : "0.0";

  // Format distribution
  const formatCounts = {};
  successful.forEach((r) => {
    const format = r.result.blob.type.split("/")[1].toUpperCase();
    formatCounts[format] = (formatCounts[format] || 0) + 1;
  });

  const formatDistribution = Object.entries(formatCounts).map(
    ([type, count]) => ({
      type,
      count,
      percentage: Math.round((count / successful.length) * 100),
    })
  );

  // Performance metrics
  const processingTimeSeconds = Math.max(0, props.processingTime / 1000);
  const averageProcessingSpeed =
    processingTimeSeconds > 0 && successful.length > 0
      ? (successful.length / processingTimeSeconds).toFixed(1)
      : "0.0";

  const totalMegapixels = successful
    .reduce((sum, r) => {
      const width = r.result?.originalDimensions?.width || 0;
      const height = r.result?.originalDimensions?.height || 0;
      const mp = (width * height) / 1000000;
      return sum + (isNaN(mp) ? 0 : mp);
    }, 0)
    .toFixed(1);

  const averageFileSize =
    successful.length > 0
      ? formatFileSize(totalOriginalSize / successful.length)
      : formatFileSize(0);

  const memoryUsed = formatFileSize(totalOriginalSize * 2); // Rough estimate

  // Enhanced size change analysis
  const sizeChangePercentage =
    totalOriginalSize > 0
      ? ((totalSizeSaved / totalOriginalSize) * 100).toFixed(1)
      : "0.0";

  const absoluteSizeChangePercentage = Math.abs(
    parseFloat(sizeChangePercentage)
  );

  let sizeChangeType, sizeChangeIcon, sizeChangeLabel, sizeChangeDisplay;

  if (totalSizeSaved > 0) {
    // Files got smaller (compression worked)
    sizeChangeType = "reduced";
    sizeChangeIcon = ArrowDownIcon;
    sizeChangeLabel = "Size Reduced";
    sizeChangeDisplay = `-${formatFileSize(totalSizeSaved)}`;
  } else if (totalSizeSaved < 0) {
    // Files got larger (quality preservation)
    sizeChangeType = "increased";
    sizeChangeIcon = ArrowUpIcon;
    sizeChangeLabel = "Size Increased";
    sizeChangeDisplay = `+${formatFileSize(Math.abs(totalSizeSaved))}`;
  } else {
    // No change
    sizeChangeType = "unchanged";
    sizeChangeIcon = ScaleIcon;
    sizeChangeLabel = "Size Unchanged";
    sizeChangeDisplay = formatFileSize(0);
  }

  // Add context to percentage
  const sizeChangePercentageDisplay =
    totalSizeSaved >= 0
      ? `-${absoluteSizeChangePercentage}%`
      : `+${absoluteSizeChangePercentage}%`;

  // Quality impact analysis
  let qualityImpactText, qualityImpactColor;

  if (sizeChangeType === "increased") {
    // Size increased - likely due to quality preservation
    if (absoluteSizeChangePercentage > 50) {
      qualityImpactText = "High Quality";
      qualityImpactColor = "text-blue-600 dark:text-blue-400";
    } else if (absoluteSizeChangePercentage > 20) {
      qualityImpactText = "Enhanced Quality";
      qualityImpactColor = "text-indigo-600 dark:text-indigo-400";
    } else {
      qualityImpactText = "Quality Preserved";
      qualityImpactColor = "text-purple-600 dark:text-purple-400";
    }
  } else if (sizeChangeType === "reduced") {
    // Size reduced - check compression level
    if (absoluteSizeChangePercentage > 70) {
      qualityImpactText = "Aggressive Compression";
      qualityImpactColor = "text-orange-600 dark:text-orange-400";
    } else if (absoluteSizeChangePercentage > 40) {
      qualityImpactText = "Good Compression";
      qualityImpactColor = "text-green-600 dark:text-green-400";
    } else if (absoluteSizeChangePercentage > 10) {
      qualityImpactText = "Mild Compression";
      qualityImpactColor = "text-emerald-600 dark:text-emerald-400";
    } else {
      qualityImpactText = "Minimal Change";
      qualityImpactColor = "text-gray-600 dark:text-gray-400";
    }
  } else {
    qualityImpactText = "No Change";
    qualityImpactColor = "text-gray-600 dark:text-gray-400";
  }

  return {
    totalFiles: props.results.length,
    successRate: Math.round((successful.length / props.results.length) * 100),

    // Enhanced size change metrics
    sizeChangeType,
    sizeChangeIcon,
    sizeChangeLabel,
    sizeChangeDisplay,
    sizeChangePercentage: sizeChangePercentageDisplay,

    // Quality impact metrics
    qualityImpactText,
    qualityImpactColor,

    // Legacy support
    totalSizeSaved: sizeChangeDisplay,
    processingTime:
      processingTimeSeconds > 60
        ? `${Math.floor(processingTimeSeconds / 60)}m ${Math.floor(
            processingTimeSeconds % 60
          )}s`
        : `${Math.floor(processingTimeSeconds)}s`,
    formatDistribution,
    originalTotalSize: formatFileSize(totalOriginalSize),
    processedTotalSize: formatFileSize(totalProcessedSize),
    averageCompression,
    bestCompression,
    averageProcessingSpeed,
    totalMegapixels,
    averageFileSize,
    memoryUsed,

    // Efficiency metrics
    speedEfficiencyText:
      parseFloat(averageProcessingSpeed) > 1
        ? "Fast"
        : parseFloat(averageProcessingSpeed) > 0.5
        ? "Good"
        : "Slow",
    speedEfficiencyColor:
      parseFloat(averageProcessingSpeed) > 1
        ? "text-green-500"
        : parseFloat(averageProcessingSpeed) > 0.5
        ? "text-yellow-500"
        : "text-red-500",

    megapixelEfficiency: `${(
      parseFloat(totalMegapixels) / Math.max(1, processingTimeSeconds)
    ).toFixed(1)} MP/s`,

    sizeEfficiencyText:
      sizeChangeType === "reduced"
        ? "Optimized"
        : sizeChangeType === "increased"
        ? "Enhanced"
        : "Unchanged",
    sizeEfficiencyColor:
      sizeChangeType === "reduced"
        ? "text-green-500"
        : sizeChangeType === "increased"
        ? "text-blue-500"
        : "text-gray-500",

    memoryEfficiencyText:
      totalOriginalSize < 50 * 1024 * 1024
        ? "Light"
        : totalOriginalSize < 200 * 1024 * 1024
        ? "Moderate"
        : "Heavy",
    memoryEfficiencyColor:
      totalOriginalSize < 50 * 1024 * 1024
        ? "text-green-500"
        : totalOriginalSize < 200 * 1024 * 1024
        ? "text-yellow-500"
        : "text-red-500",

    // Overall efficiency assessment
    overallEfficiencyText: (() => {
      const speedScore =
        parseFloat(averageProcessingSpeed) > 1
          ? 3
          : parseFloat(averageProcessingSpeed) > 0.5
          ? 2
          : 1;
      const sizeScore =
        sizeChangeType === "reduced"
          ? 3
          : sizeChangeType === "increased"
          ? 2
          : 1;
      const memoryScore =
        totalOriginalSize < 50 * 1024 * 1024
          ? 3
          : totalOriginalSize < 200 * 1024 * 1024
          ? 2
          : 1;
      const totalScore = speedScore + sizeScore + memoryScore;

      return totalScore >= 8
        ? "Excellent"
        : totalScore >= 6
        ? "Good"
        : totalScore >= 4
        ? "Fair"
        : "Poor";
    })(),

    overallEfficiencyColor: (() => {
      const speedScore =
        parseFloat(averageProcessingSpeed) > 1
          ? 3
          : parseFloat(averageProcessingSpeed) > 0.5
          ? 2
          : 1;
      const sizeScore =
        sizeChangeType === "reduced"
          ? 3
          : sizeChangeType === "increased"
          ? 2
          : 1;
      const memoryScore =
        totalOriginalSize < 50 * 1024 * 1024
          ? 3
          : totalOriginalSize < 200 * 1024 * 1024
          ? 2
          : 1;
      const totalScore = speedScore + sizeScore + memoryScore;

      return totalScore >= 8
        ? "text-green-600 dark:text-green-400"
        : totalScore >= 6
        ? "text-blue-600 dark:text-blue-400"
        : totalScore >= 4
        ? "text-yellow-600 dark:text-yellow-400"
        : "text-red-600 dark:text-red-400";
    })(),

    overallEfficiencyBg: (() => {
      const speedScore =
        parseFloat(averageProcessingSpeed) > 1
          ? 3
          : parseFloat(averageProcessingSpeed) > 0.5
          ? 2
          : 1;
      const sizeScore =
        sizeChangeType === "reduced"
          ? 3
          : sizeChangeType === "increased"
          ? 2
          : 1;
      const memoryScore =
        totalOriginalSize < 50 * 1024 * 1024
          ? 3
          : totalOriginalSize < 200 * 1024 * 1024
          ? 2
          : 1;
      const totalScore = speedScore + sizeScore + memoryScore;

      return totalScore >= 8
        ? "bg-green-50 dark:bg-green-900/10"
        : totalScore >= 6
        ? "bg-blue-50 dark:bg-blue-900/10"
        : totalScore >= 4
        ? "bg-yellow-50 dark:bg-yellow-900/10"
        : "bg-red-50 dark:bg-red-900/10";
    })(),

    efficiencyDescription: (() => {
      if (sizeChangeType === "increased") {
        return "Quality-focused processing with size trade-offs";
      } else if (sizeChangeType === "reduced") {
        return "Size-optimized processing with good compression";
      } else {
        return "Balanced processing with minimal changes";
      }
    })(),
  };
});
</script>
