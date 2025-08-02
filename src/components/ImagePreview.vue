<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
    <!-- Header -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Processed Images ({{ successfulResults.length }})
        </h3>
        <div class="flex items-center space-x-2">
          <button
            @click="viewMode = viewMode === 'grid' ? 'list' : 'grid'"
            class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Squares2X2Icon v-if="viewMode === 'list'" class="w-5 h-5" />
            <ListBulletIcon v-else class="w-5 h-5" />
          </button>
          <button
            v-if="successfulResults.length > 0"
            @click="$emit('download-all')"
            :disabled="isDownloading"
            class="inline-flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors duration-200"
          >
            <ArrowDownTrayIcon class="w-4 h-4 mr-2" />
            {{ isDownloading ? "Creating ZIP..." : "Download All" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Results -->
    <div class="p-4">
      <div v-if="successfulResults.length === 0" class="text-center py-12">
        <PhotoIcon class="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p class="text-gray-500 dark:text-gray-400">No processed images yet</p>
      </div>

      <!-- Grid View -->
      <div
        v-else-if="viewMode === 'grid'"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        <div
          v-for="(result, index) in successfulResults"
          :key="index"
          class="group relative bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200"
        >
          <!-- Image -->
          <div class="aspect-square relative overflow-hidden">
            <img
              :src="result.previewUrl"
              :alt="result.file.name"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              loading="lazy"
            />
            <div
              class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200"
            ></div>

            <!-- Overlay Actions -->
            <div
              class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <div class="flex items-center space-x-2">
                <button
                  @click="downloadSingle(result)"
                  class="p-2 bg-white/90 hover:bg-white text-gray-700 rounded-full shadow-lg transition-all duration-200"
                >
                  <ArrowDownTrayIcon class="w-4 h-4" />
                </button>
                <button
                  @click="openPreview(result)"
                  class="p-2 bg-white/90 hover:bg-white text-gray-700 rounded-full shadow-lg transition-all duration-200"
                >
                  <EyeIcon class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <!-- Info -->
          <div class="p-3">
            <h4
              class="text-sm font-medium text-gray-900 dark:text-white truncate mb-1"
            >
              {{ result.file.name }}
            </h4>
            <div
              class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400"
            >
              <span
                >{{ result.result.newDimensions.width }}×{{
                  result.result.newDimensions.height
                }}</span
              >
              <span class="text-green-600 dark:text-green-400"
                >-{{ result.result.compressionRatio }}%</span
              >
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ formatFileSize(result.result.newSize) }}
            </div>
          </div>
        </div>
      </div>

      <!-- List View -->
      <div v-else class="space-y-3">
        <div
          v-for="(result, index) in successfulResults"
          :key="index"
          class="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
        >
          <!-- Thumbnail -->
          <div class="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden mr-4">
            <img
              :src="result.previewUrl"
              :alt="result.file.name"
              class="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <h4
              class="text-sm font-medium text-gray-900 dark:text-white truncate mb-1"
            >
              {{ result.file.name }}
            </h4>
            <div
              class="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400"
            >
              <span
                >{{ result.result.originalDimensions.width }}×{{
                  result.result.originalDimensions.height
                }}</span
              >
              <span>→</span>
              <span
                >{{ result.result.newDimensions.width }}×{{
                  result.result.newDimensions.height
                }}</span
              >
              <span class="text-green-600 dark:text-green-400"
                >-{{ result.result.compressionRatio }}%</span
              >
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ formatFileSize(result.result.originalSize) }} →
              {{ formatFileSize(result.result.newSize) }}
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center space-x-2 ml-4">
            <button
              @click="downloadSingle(result)"
              class="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-200"
            >
              <ArrowDownTrayIcon class="w-4 h-4" />
            </button>
            <button
              @click="openPreview(result)"
              class="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-200"
            >
              <EyeIcon class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import {
  ArrowDownTrayIcon,
  EyeIcon,
  PhotoIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from "@heroicons/vue/24/outline";
import { formatFileSize } from "../utils/imageProcessor.js";
import { downloadImage } from "../utils/zipUtils.js";

const props = defineProps({
  results: {
    type: Array,
    default: () => [],
  },
  isDownloading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["download-all", "preview-image"]);

const viewMode = ref("grid");

const successfulResults = computed(() => {
  return props.results.filter((result) => result.success && result.result);
});

const downloadSingle = (result) => {
  const extension = result.result.blob.type.split("/")[1];
  const baseName = result.file.name.replace(/\.[^/.]+$/, "");
  const filename = `${baseName}_resized.${extension}`;

  downloadImage(result.result.blob, filename);
};

const openPreview = (result) => {
  emit("preview-image", result);
};
</script>
