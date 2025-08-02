<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
      @click="$emit('close')"
    ></div>

    <!-- Modal -->
    <div class="flex min-h-full items-center justify-center p-4">
      <div
        class="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700"
        >
          <div class="flex-1 min-w-0">
            <h3
              class="text-lg font-semibold text-gray-900 dark:text-white truncate"
            >
              {{ image.file.name }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ image.result.originalDimensions.width }}×{{
                image.result.originalDimensions.height
              }}
              → {{ image.result.newDimensions.width }}×{{
                image.result.newDimensions.height
              }}
            </p>
          </div>
          <button
            @click="$emit('close')"
            class="ml-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <XMarkIcon class="w-5 h-5" />
          </button>
        </div>

        <!-- Image Container -->
        <div
          class="relative overflow-auto max-h-[60vh] bg-gray-50 dark:bg-gray-900"
        >
          <div class="flex items-center justify-center min-h-[400px] p-4">
            <img
              :src="image.previewUrl"
              :alt="image.file.name"
              class="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            />
          </div>
        </div>

        <!-- Details -->
        <div class="p-4 border-t border-gray-200 dark:border-gray-700">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <div class="text-gray-500 dark:text-gray-400">Original Size</div>
              <div class="font-medium text-gray-900 dark:text-white">
                {{ formatFileSize(image.result.originalSize) }}
              </div>
            </div>
            <div>
              <div class="text-gray-500 dark:text-gray-400">New Size</div>
              <div class="font-medium text-gray-900 dark:text-white">
                {{ formatFileSize(image.result.newSize) }}
              </div>
            </div>
            <div>
              <div class="text-gray-500 dark:text-gray-400">Compression</div>
              <div class="font-medium text-green-600 dark:text-green-400">
                -{{ image.result.compressionRatio }}%
              </div>
            </div>
            <div>
              <div class="text-gray-500 dark:text-gray-400">Format</div>
              <div class="font-medium text-gray-900 dark:text-white">
                {{ image.result.blob.type.split("/")[1].toUpperCase() }}
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div
          class="flex items-center justify-end space-x-3 p-4 bg-gray-50 dark:bg-gray-700/50"
        >
          <button
            @click="downloadImage"
            class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            <ArrowDownTrayIcon class="w-4 h-4 mr-2" />
            Download
          </button>
          <button
            @click="$emit('close')"
            class="inline-flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// No imports needed for defineProps and defineEmits
import { XMarkIcon, ArrowDownTrayIcon } from "@heroicons/vue/24/outline";
import { formatFileSize } from "../utils/imageProcessor.js";
import { downloadImage as downloadImageUtil } from "../utils/zipUtils.js";

const props = defineProps({
  image: {
    type: Object,
    required: true,
  },
});

defineEmits(["close"]);

const downloadImage = () => {
  const extension = props.image.result.blob.type.split("/")[1];
  const baseName = props.image.file.name.replace(/\.[^/.]+$/, "");
  const filename = `${baseName}_resized.${extension}`;

  downloadImageUtil(props.image.result.blob, filename);
};
</script>
