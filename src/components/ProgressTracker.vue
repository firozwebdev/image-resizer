<template>
  <div
    v-if="isVisible"
    class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
  >
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Processing Images
      </h3>
      <button
        v-if="canCancel"
        @click="$emit('cancel')"
        class="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
      >
        Cancel
      </button>
    </div>

    <!-- Overall Progress -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ progress.stage || "Processing" }}
        </span>
        <span class="text-sm text-gray-500 dark:text-gray-400">
          {{ progress.completed }}/{{ progress.total }} ({{
            progress.percentage
          }}%)
        </span>
      </div>

      <div
        class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden"
      >
        <div
          class="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300 ease-out"
          :style="{ width: `${progress.percentage}%` }"
        >
          <div class="h-full bg-white/20 animate-pulse"></div>
        </div>
      </div>
    </div>

    <!-- Current File -->
    <div v-if="progress.currentFile" class="mb-4">
      <div
        class="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
      >
        <div class="flex-shrink-0">
          <div
            class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"
          ></div>
        </div>
        <div class="flex-1 min-w-0">
          <p
            class="text-sm font-medium text-blue-900 dark:text-blue-100 truncate"
          >
            Processing: {{ progress.currentFile }}
          </p>
        </div>
      </div>
    </div>

    <!-- Statistics -->
    <div
      v-if="stats"
      class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700"
    >
      <div class="text-center">
        <div class="text-lg font-semibold text-green-600 dark:text-green-400">
          {{ stats.successful }}
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400">Successful</div>
      </div>
      <div class="text-center">
        <div class="text-lg font-semibold text-red-600 dark:text-red-400">
          {{ stats.failed }}
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400">Failed</div>
      </div>
      <div class="text-center">
        <div class="text-lg font-semibold text-blue-600 dark:text-blue-400">
          {{ stats.totalSizeSaved }}
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400">Size Saved</div>
      </div>
      <div class="text-center">
        <div class="text-lg font-semibold text-purple-600 dark:text-purple-400">
          {{ stats.avgCompression }}%
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400">
          Avg Compression
        </div>
      </div>
    </div>

    <!-- Speed and ETA -->
    <div
      v-if="speedStats"
      class="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
    >
      <div class="text-sm text-gray-600 dark:text-gray-400">
        Speed: {{ speedStats.speed }} images/sec
      </div>
      <div class="text-sm text-gray-600 dark:text-gray-400">
        ETA: {{ speedStats.eta }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { formatFileSize } from "../utils/imageProcessor.js";

const props = defineProps({
  progress: {
    type: Object,
    default: () => ({
      completed: 0,
      total: 0,
      percentage: 0,
      currentFile: null,
      stage: "Processing",
    }),
  },
  results: {
    type: Array,
    default: () => [],
  },
  isVisible: {
    type: Boolean,
    default: false,
  },
  canCancel: {
    type: Boolean,
    default: true,
  },
  startTime: {
    type: Number,
    default: null,
  },
});

defineEmits(["cancel"]);

const stats = computed(() => {
  if (!props.results.length) return null;

  const successful = props.results.filter((r) => r.success).length;
  const failed = props.results.filter((r) => !r.success).length;

  const successfulResults = props.results.filter((r) => r.success && r.result);
  const totalOriginalSize = successfulResults.reduce(
    (sum, r) => sum + r.result.originalSize,
    0
  );
  const totalNewSize = successfulResults.reduce(
    (sum, r) => sum + r.result.newSize,
    0
  );
  const totalSizeSaved = formatFileSize(totalOriginalSize - totalNewSize);

  const avgCompression =
    successfulResults.length > 0
      ? (
          successfulResults.reduce(
            (sum, r) => sum + parseFloat(r.result.compressionRatio),
            0
          ) / successfulResults.length
        ).toFixed(1)
      : 0;

  return {
    successful,
    failed,
    totalSizeSaved,
    avgCompression,
  };
});

const speedStats = computed(() => {
  if (!props.startTime || props.progress.completed === 0) return null;

  const elapsedSeconds = (Date.now() - props.startTime) / 1000;
  const speed = (props.progress.completed / elapsedSeconds).toFixed(1);

  const remaining = props.progress.total - props.progress.completed;
  const etaSeconds = remaining / (props.progress.completed / elapsedSeconds);

  const eta =
    etaSeconds > 60
      ? `${Math.floor(etaSeconds / 60)}m ${Math.floor(etaSeconds % 60)}s`
      : `${Math.floor(etaSeconds)}s`;

  return { speed, eta };
});
</script>
