<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Resize Settings
      </h3>
      <button
        @click="resetToDefaults"
        class="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
      >
        Reset to Defaults
      </button>
    </div>

    <!-- Preset Sizes -->
    <div>
      <label
        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3"
      >
        Quick Presets
      </label>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <button
          v-for="(preset, key) in PRESET_SIZES"
          :key="key"
          @click="applyPreset(preset)"
          :class="[
            'p-3 text-sm rounded-lg border transition-all duration-200',
            isPresetActive(preset)
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300',
          ]"
        >
          <div class="font-medium">{{ preset.name }}</div>
          <div class="text-xs opacity-75">
            {{ preset.width }}×{{ preset.height }}
          </div>
        </button>
      </div>
    </div>

    <!-- Custom Dimensions -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Width (px)
        </label>
        <input
          v-model.number="settings.width"
          type="number"
          min="1"
          max="8192"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          placeholder="Auto"
        />
      </div>
      <div>
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Height (px)
        </label>
        <input
          v-model.number="settings.height"
          type="number"
          min="1"
          max="8192"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          placeholder="Auto"
        />
      </div>
    </div>

    <!-- Aspect Ratio -->
    <div class="flex items-center justify-between">
      <div>
        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Maintain Aspect Ratio
        </label>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Only applies when width OR height is specified (not both)
        </p>
      </div>
      <button
        @click="settings.maintainAspectRatio = !settings.maintainAspectRatio"
        :class="[
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
          settings.maintainAspectRatio
            ? 'bg-blue-600'
            : 'bg-gray-200 dark:bg-gray-600',
        ]"
      >
        <span
          :class="[
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200',
            settings.maintainAspectRatio ? 'translate-x-6' : 'translate-x-1',
          ]"
        />
      </button>
    </div>

    <!-- Output Format -->
    <div>
      <label
        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3"
      >
        Output Format
      </label>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <!-- Keep Original Format Option -->
        <button
          @click="settings.format = null"
          :class="[
            'p-2 text-sm rounded-lg border transition-all duration-200',
            settings.format === null
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300',
          ]"
        >
          <div class="font-medium">Keep Original</div>
          <div class="text-xs opacity-75">Preserves transparency</div>
        </button>

        <!-- Specific Format Options -->
        <button
          v-for="(format, key) in OUTPUT_FORMATS"
          :key="key"
          @click="settings.format = format"
          :class="[
            'p-2 text-sm rounded-lg border transition-all duration-200',
            settings.format === format
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300',
          ]"
        >
          <div class="font-medium">{{ key }}</div>
          <div class="text-xs opacity-75">
            {{
              key === "PNG"
                ? "Supports transparency"
                : key === "WebP"
                ? "Modern format"
                : "Smaller file size"
            }}
          </div>
        </button>
      </div>
    </div>

    <!-- Quality Slider -->
    <div v-if="settings.format && settings.format !== OUTPUT_FORMATS.PNG">
      <label
        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3"
      >
        Quality: {{ Math.round(settings.quality * 100) }}%
      </label>
      <input
        v-model.number="settings.quality"
        type="range"
        min="0.1"
        max="1"
        step="0.1"
        class="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
      />
      <div
        class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1"
      >
        <span>Lower size</span>
        <span>Higher quality</span>
      </div>
    </div>

    <!-- Resize Algorithm -->
    <div>
      <label
        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3"
      >
        Resize Algorithm
      </label>
      <select
        v-model="settings.algorithm"
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
      >
        <option :value="RESIZE_ALGORITHMS.LANCZOS">
          Lanczos (Best Quality)
        </option>
        <option :value="RESIZE_ALGORITHMS.BICUBIC">
          Bicubic (Good Quality)
        </option>
        <option :value="RESIZE_ALGORITHMS.BILINEAR">Bilinear (Fast)</option>
        <option :value="RESIZE_ALGORITHMS.NEAREST">Nearest (Pixel Art)</option>
      </select>
    </div>

    <!-- Background Color (for JPEG) -->
    <div v-if="settings.format === OUTPUT_FORMATS.JPEG">
      <label
        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3"
      >
        Background Color (for transparent images)
      </label>
      <div class="flex items-center space-x-3">
        <input
          v-model="settings.backgroundColor"
          type="color"
          class="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
        />
        <input
          v-model="settings.backgroundColor"
          type="text"
          class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          placeholder="transparent"
        />
      </div>
    </div>

    <!-- Transparency Info (for PNG/WebP/Keep Original) -->
    <div
      v-if="
        !settings.format ||
        settings.format === OUTPUT_FORMATS.PNG ||
        settings.format === OUTPUT_FORMATS.WEBP
      "
      class="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
    >
      <div class="flex items-center space-x-2">
        <div class="w-2 h-2 bg-green-500 rounded-full"></div>
        <span class="text-sm font-medium text-green-800 dark:text-green-200">
          Transparency Preserved
        </span>
      </div>
      <p class="text-xs text-green-600 dark:text-green-300 mt-1">
        Transparent areas in your images will remain transparent in the output.
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from "vue";
import {
  PRESET_SIZES,
  OUTPUT_FORMATS,
  RESIZE_ALGORITHMS,
} from "../utils/imageProcessor.js";

const emit = defineEmits(["settings-changed"]);

const defaultSettings = {
  width: null,
  height: null,
  quality: 0.9,
  format: null, // Will preserve original format by default
  algorithm: RESIZE_ALGORITHMS.LANCZOS,
  maintainAspectRatio: true,
  backgroundColor: "transparent", // Default to transparent to preserve PNG transparency
};

const settings = reactive({ ...defaultSettings });

// Watch for settings changes and emit to parent
watch(
  settings,
  (newSettings) => {
    emit("settings-changed", { ...newSettings });
  },
  { deep: true }
);

const applyPreset = (preset) => {
  settings.width = preset.width;
  settings.height = preset.height;
};

const isPresetActive = (preset) => {
  return settings.width === preset.width && settings.height === preset.height;
};

const resetToDefaults = () => {
  Object.assign(settings, defaultSettings);
};

// Emit initial settings
emit("settings-changed", { ...settings });
</script>

<style scoped>
.slider::-webkit-slider-thumb {
  appearance: none;
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.slider::-moz-range-thumb {
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
