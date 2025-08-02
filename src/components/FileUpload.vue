<template>
  <div class="w-full">
    <div
      @drop="handleDrop"
      @dragover.prevent
      @dragenter.prevent
      @dragleave="handleDragLeave"
      @dragenter="handleDragEnter"
      :class="[
        'relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer',
        isDragging
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105'
          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500',
        'hover:bg-gray-50 dark:hover:bg-gray-800/50',
      ]"
      @click="triggerFileInput"
    >
      <input
        ref="fileInput"
        type="file"
        multiple
        accept="image/*"
        @change="handleFileSelect"
        class="hidden"
      />

      <div class="space-y-4">
        <div class="flex justify-center">
          <div
            :class="[
              'p-4 rounded-full transition-all duration-300',
              isDragging
                ? 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
            ]"
          >
            <CloudArrowUpIcon class="w-8 h-8" />
          </div>
        </div>

        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {{ isDragging ? "Drop your images here" : "Upload Images" }}
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Drag and drop your images or click to browse
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-500">
            Supports: JPG, PNG, WebP, GIF, BMP • Max 50 files
          </p>
        </div>

        <button
          type="button"
          class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
        >
          <FolderOpenIcon class="w-4 h-4 mr-2" />
          Choose Files
        </button>
      </div>

      <!-- Loading overlay -->
      <div
        v-if="isProcessing"
        class="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl flex items-center justify-center"
      >
        <div class="text-center">
          <div
            class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"
          ></div>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Processing files...
          </p>
        </div>
      </div>
    </div>

    <!-- File list preview -->
    <div v-if="selectedFiles.length > 0" class="mt-6">
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-sm font-medium text-gray-900 dark:text-white">
          Selected Files ({{ selectedFiles.length }})
        </h4>
        <button
          @click="clearFiles"
          class="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        >
          Clear All
        </button>
      </div>

      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto"
      >
        <div
          v-for="(file, index) in selectedFiles"
          :key="index"
          class="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
        >
          <div
            class="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-3"
          >
            <PhotoIcon class="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div class="flex-1 min-w-0">
            <p
              class="text-sm font-medium text-gray-900 dark:text-white truncate"
            >
              {{ file.name }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ formatFileSize(file.size) }}
            </p>
          </div>
          <button
            @click="removeFile(index)"
            class="flex-shrink-0 ml-2 text-gray-400 hover:text-red-500 transition-colors"
          >
            <XMarkIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import {
  CloudArrowUpIcon,
  FolderOpenIcon,
  PhotoIcon,
  XMarkIcon,
} from "@heroicons/vue/24/outline";
import { formatFileSize } from "../utils/imageProcessor.js";

const emit = defineEmits(["files-selected"]);

const fileInput = ref(null);
const isDragging = ref(false);
const isProcessing = ref(false);
const selectedFiles = ref([]);

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files);
  processFiles(files);
};

const handleDrop = (event) => {
  event.preventDefault();
  isDragging.value = false;

  const files = Array.from(event.dataTransfer.files).filter((file) =>
    file.type.startsWith("image/")
  );

  if (files.length > 0) {
    processFiles(files);
  }
};

const handleDragEnter = () => {
  isDragging.value = true;
};

const handleDragLeave = (event) => {
  // Only set to false if we're leaving the drop zone entirely
  if (!event.currentTarget.contains(event.relatedTarget)) {
    isDragging.value = false;
  }
};

const processFiles = async (files) => {
  if (files.length > 50) {
    alert("Maximum 50 files allowed");
    return;
  }

  isProcessing.value = true;

  // Filter for valid image files
  const validFiles = files.filter((file) => {
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/bmp",
    ];
    return validTypes.includes(file.type) && file.size <= 50 * 1024 * 1024; // 50MB limit
  });

  if (validFiles.length !== files.length) {
    const invalidCount = files.length - validFiles.length;
    alert(`${invalidCount} file(s) were skipped (invalid format or too large)`);
  }

  selectedFiles.value = [...selectedFiles.value, ...validFiles];

  setTimeout(() => {
    isProcessing.value = false;
    emit("files-selected", selectedFiles.value);
  }, 500);
};

const removeFile = (index) => {
  selectedFiles.value.splice(index, 1);
  emit("files-selected", selectedFiles.value);
};

const clearFiles = () => {
  selectedFiles.value = [];
  if (fileInput.value) {
    fileInput.value.value = "";
  }
  emit("files-selected", []);
};
</script>
