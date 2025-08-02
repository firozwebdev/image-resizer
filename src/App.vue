<template>
  <div
    class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300"
  >
    <!-- Header -->
    <header
      class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center space-x-3">
            <div class="p-2 bg-blue-600 rounded-lg">
              <PhotoIcon class="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 class="text-xl font-bold text-gray-900 dark:text-white">
                ImageResizer Pro
              </h1>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Professional bulk image processing
              </p>
            </div>
          </div>

          <div class="flex items-center space-x-4">
            <!-- Stats -->
            <div
              v-if="processedCount > 0"
              class="hidden sm:flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400"
            >
              <span>{{ processedCount }} processed</span>
              <span v-if="totalSizeSaved">{{ totalSizeSaved }} saved</span>
            </div>

            <!-- Theme Toggle -->
            <button
              @click="toggleTheme"
              class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
            >
              <SunIcon v-if="isDark" class="w-5 h-5" />
              <MoonIcon v-else class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Column: Upload & Settings -->
        <div class="lg:col-span-1 space-y-6">
          <!-- File Upload -->
          <FileUpload @files-selected="handleFilesSelected" />

          <!-- Settings Panel -->
          <SettingsPanel
            v-if="selectedFiles.length > 0"
            @settings-changed="handleSettingsChanged"
          />

          <!-- Process Button -->
          <div v-if="selectedFiles.length > 0 && !isProcessing">
            <button
              @click="processImages"
              :disabled="!canProcess"
              class="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-xl shadow-lg hover:shadow-xl disabled:shadow-none transition-all duration-200 transform hover:scale-105 disabled:scale-100"
            >
              <div class="flex items-center justify-center space-x-2">
                <CpuChipIcon class="w-5 h-5" />
                <span
                  >Process {{ selectedFiles.length }} Image{{
                    selectedFiles.length > 1 ? "s" : ""
                  }}</span
                >
              </div>
            </button>
          </div>
        </div>

        <!-- Right Column: Progress & Results -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Progress Tracker -->
          <ProgressTracker
            v-if="isProcessing || processedResults.length > 0"
            :progress="progress"
            :results="processedResults"
            :is-visible="isProcessing"
            :can-cancel="isProcessing"
            :start-time="processingStartTime"
            @cancel="cancelProcessing"
          />

          <!-- Image Preview -->
          <ImagePreview
            v-if="processedResults.length > 0"
            :results="processedResults"
            :is-downloading="isDownloading"
            @download-all="downloadAllAsZip"
            @preview-image="openImagePreview"
          />

          <!-- Welcome Message -->
          <div v-if="selectedFiles.length === 0" class="text-center py-16">
            <div class="max-w-md mx-auto">
              <div
                class="p-6 bg-blue-100 dark:bg-blue-900/20 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center"
              >
                <SparklesIcon
                  class="w-12 h-12 text-blue-600 dark:text-blue-400"
                />
              </div>
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Welcome to ImageResizer Pro
              </h2>
              <p class="text-gray-600 dark:text-gray-400 mb-6">
                Upload your images to get started with professional-grade batch
                resizing, format conversion, and compression.
              </p>
              <div
                class="grid grid-cols-2 gap-4 text-sm text-gray-500 dark:text-gray-400"
              >
                <div class="flex items-center space-x-2">
                  <CheckIcon class="w-4 h-4 text-green-500" />
                  <span>Batch processing</span>
                </div>
                <div class="flex items-center space-x-2">
                  <CheckIcon class="w-4 h-4 text-green-500" />
                  <span>Multiple formats</span>
                </div>
                <div class="flex items-center space-x-2">
                  <CheckIcon class="w-4 h-4 text-green-500" />
                  <span>Quality preservation</span>
                </div>
                <div class="flex items-center space-x-2">
                  <CheckIcon class="w-4 h-4 text-green-500" />
                  <span>ZIP downloads</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Image Preview Modal -->
    <ImagePreviewModal
      v-if="previewImage"
      :image="previewImage"
      @close="closeImagePreview"
    />

    <!-- Notifications -->
    <div class="fixed bottom-4 right-4 z-50 space-y-2">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="[
          'p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300',
          notification.type === 'success'
            ? 'bg-green-500 text-white'
            : notification.type === 'error'
            ? 'bg-red-500 text-white'
            : 'bg-blue-500 text-white',
        ]"
      >
        <div class="flex items-center space-x-2">
          <CheckCircleIcon
            v-if="notification.type === 'success'"
            class="w-5 h-5"
          />
          <ExclamationCircleIcon
            v-else-if="notification.type === 'error'"
            class="w-5 h-5"
          />
          <InformationCircleIcon v-else class="w-5 h-5" />
          <span class="text-sm font-medium">{{ notification.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import {
  PhotoIcon,
  SunIcon,
  MoonIcon,
  CpuChipIcon,
  SparklesIcon,
  CheckIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
} from "@heroicons/vue/24/outline";

// Components
import FileUpload from "./components/FileUpload.vue";
import SettingsPanel from "./components/SettingsPanel.vue";
import ProgressTracker from "./components/ProgressTracker.vue";
import ImagePreview from "./components/ImagePreview.vue";
import ImagePreviewModal from "./components/ImagePreviewModal.vue";

// Utilities
import { batchProcessImages, formatFileSize } from "./utils/imageProcessor.js";
import {
  downloadAsZip,
  createPreviewUrl,
  cleanupPreviewUrls,
} from "./utils/zipUtils.js";
import { useTheme } from "./composables/useTheme.js";
import {
  validateFiles,
  validateSettings,
  checkBrowserCompatibility,
} from "./utils/validation.js";
import {
  checkMemoryCapacity,
  estimateProcessingTime,
} from "./utils/performanceUtils.js";

// Theme
const { isDark, toggleTheme, initTheme } = useTheme();

// State
const selectedFiles = ref([]);
const resizeSettings = ref({});
const isProcessing = ref(false);
const processedResults = ref([]);
const progress = ref({ completed: 0, total: 0, percentage: 0 });
const processingStartTime = ref(null);
const isDownloading = ref(false);
const previewImage = ref(null);
const notifications = ref([]);

// Computed
const canProcess = computed(() => {
  return (
    selectedFiles.value.length > 0 &&
    (resizeSettings.value.width || resizeSettings.value.height)
  );
});

const processedCount = computed(() => {
  return processedResults.value.filter((r) => r.success).length;
});

const totalSizeSaved = computed(() => {
  const successful = processedResults.value.filter(
    (r) => r.success && r.result
  );
  if (successful.length === 0) return null;

  const originalSize = successful.reduce(
    (sum, r) => sum + r.result.originalSize,
    0
  );
  const newSize = successful.reduce((sum, r) => sum + r.result.newSize, 0);

  return formatFileSize(originalSize - newSize);
});

// Methods
const handleFilesSelected = (files) => {
  if (files.length === 0) {
    selectedFiles.value = [];
    processedResults.value = [];
    return;
  }

  // Validate files
  const validation = validateFiles(files);

  if (validation.invalidFiles.length > 0) {
    const invalidCount = validation.invalidFiles.length;
    showNotification(
      `${invalidCount} file${
        invalidCount > 1 ? "s" : ""
      } skipped due to validation errors`,
      "error"
    );
  }

  selectedFiles.value = validation.validFiles;

  // Check memory capacity
  if (validation.validFiles.length > 0) {
    const avgSize =
      validation.validFiles.reduce((sum, f) => sum + f.size, 0) /
      validation.validFiles.length;
    const memoryCheck = checkMemoryCapacity(
      validation.validFiles.length,
      avgSize
    );

    if (!memoryCheck.canProcess) {
      showNotification(memoryCheck.recommendation, "info");
    }
  }

  if (files.length === 0) {
    processedResults.value = [];
  }
};

const handleSettingsChanged = (settings) => {
  resizeSettings.value = settings;
};

const processImages = async () => {
  if (!canProcess.value) return;

  // Validate settings
  const settingsValidation = validateSettings(resizeSettings.value);
  if (!settingsValidation.isValid) {
    showNotification(
      `Invalid settings: ${settingsValidation.errors.join(", ")}`,
      "error"
    );
    return;
  }

  // Show processing time estimate
  const timeEstimate = estimateProcessingTime(
    selectedFiles.value,
    resizeSettings.value
  );
  if (timeEstimate.estimatedTimeSeconds > 30) {
    showNotification(
      `Estimated processing time: ${timeEstimate.estimatedTimeFormatted}`,
      "info"
    );
  }

  isProcessing.value = true;
  processingStartTime.value = Date.now();
  processedResults.value = [];

  try {
    const results = await batchProcessImages(
      selectedFiles.value,
      resizeSettings.value,
      (progressData) => {
        progress.value = progressData;
      }
    );

    // Create preview URLs for successful results
    results.forEach((result) => {
      if (result.success && result.result) {
        result.previewUrl = createPreviewUrl(result.result.blob);
      }
    });

    processedResults.value = results;

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    if (successCount > 0) {
      showNotification(
        `Successfully processed ${successCount} image${
          successCount > 1 ? "s" : ""
        }`,
        "success"
      );
    }

    if (failCount > 0) {
      showNotification(
        `${failCount} image${failCount > 1 ? "s" : ""} failed to process`,
        "error"
      );
    }
  } catch (error) {
    console.error("Processing error:", error);
    showNotification("An error occurred during processing", "error");
  } finally {
    isProcessing.value = false;
  }
};

const cancelProcessing = () => {
  isProcessing.value = false;
  showNotification("Processing cancelled", "info");
};

const downloadAllAsZip = async () => {
  const successfulResults = processedResults.value.filter((r) => r.success);
  if (successfulResults.length === 0) return;

  isDownloading.value = true;

  try {
    await downloadAsZip(successfulResults, "resized-images.zip");
    showNotification("ZIP file downloaded successfully", "success");
  } catch (error) {
    console.error("Download error:", error);
    showNotification("Failed to create ZIP file", "error");
  } finally {
    isDownloading.value = false;
  }
};

const openImagePreview = (result) => {
  previewImage.value = result;
};

const closeImagePreview = () => {
  previewImage.value = null;
};

const showNotification = (message, type = "info") => {
  const id = Date.now();
  notifications.value.push({ id, message, type });

  setTimeout(() => {
    notifications.value = notifications.value.filter((n) => n.id !== id);
  }, 5000);
};

// Lifecycle
onMounted(() => {
  initTheme();

  // Check browser compatibility
  const compatibility = checkBrowserCompatibility();
  if (!compatibility.isSupported) {
    showNotification(
      `Browser not fully supported. Missing: ${compatibility.unsupported.join(
        ", "
      )}`,
      "error"
    );
  }

  if (compatibility.warnings.length > 0) {
    compatibility.warnings.forEach((warning) => {
      showNotification(warning, "info");
    });
  }
});

onUnmounted(() => {
  // Cleanup preview URLs
  const urls = processedResults.value
    .filter((r) => r.previewUrl)
    .map((r) => r.previewUrl);
  cleanupPreviewUrls(urls);
});
</script>
