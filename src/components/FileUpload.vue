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
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 max-h-80 overflow-y-auto scrollbar-thin"
      >
        <div
          v-for="(file, index) in selectedFiles"
          :key="index"
          class="relative group bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden hover:shadow-md transition-all duration-200"
        >
          <!-- Image Thumbnail -->
          <div
            class="aspect-square relative overflow-hidden bg-gray-100 dark:bg-gray-700"
          >
            <img
              v-if="filePreviews[index]"
              :src="filePreviews[index]"
              :alt="file.name"
              class="w-full h-full object-cover"
              loading="lazy"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <div
                class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"
              ></div>
            </div>

            <!-- Remove button overlay -->
            <button
              @click="removeFile(index)"
              class="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
            >
              <XMarkIcon class="w-3 h-3" />
            </button>

            <!-- File info overlay -->
            <div
              class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2"
            >
              <p class="text-white text-xs font-medium truncate">
                {{ file.name }}
              </p>
              <p class="text-white/80 text-xs">
                {{ formatFileSize(file.size) }}
              </p>
            </div>
          </div>
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
const filePreviews = ref([]);

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
  if (files.length > 1000) {
    alert("Maximum 1000 files allowed");
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
    return validTypes.includes(file.type) && file.size <= 100 * 1024 * 1024; // 100MB limit
  });

  if (validFiles.length !== files.length) {
    const invalidCount = files.length - validFiles.length;
    alert(`${invalidCount} file(s) were skipped (invalid format or too large)`);
  }

  const startIndex = selectedFiles.value.length;
  selectedFiles.value = [...selectedFiles.value, ...validFiles];

  // Generate previews for new files
  await generatePreviews(validFiles, startIndex);

  setTimeout(() => {
    isProcessing.value = false;
    emit("files-selected", selectedFiles.value);
  }, 100);
};

const generatePreviews = async (files, startIndex) => {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const preview = await createImagePreview(file);
      filePreviews.value[startIndex + i] = preview;
    } catch (error) {
      console.error("Failed to generate preview for", file.name, error);
      // Keep loading state for failed previews
    }
  }
};

const createImagePreview = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Calculate thumbnail size (max 150px)
        const maxSize = 150;
        const ratio = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const removeFile = (index) => {
  selectedFiles.value.splice(index, 1);
  filePreviews.value.splice(index, 1);
  emit("files-selected", selectedFiles.value);
};

const clearFiles = () => {
  selectedFiles.value = [];
  filePreviews.value = [];
  if (fileInput.value) {
    fileInput.value.value = "";
  }
  emit("files-selected", []);
};
</script>
