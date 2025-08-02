<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Advanced Settings
      </h3>
      <button
        @click="isExpanded = !isExpanded"
        class="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
      >
        {{ isExpanded ? 'Hide' : 'Show' }} Advanced
      </button>
    </div>
    
    <div v-if="isExpanded" class="space-y-6">
      <!-- Batch Rename -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Batch Rename Pattern
        </label>
        <div class="flex items-center space-x-2">
          <input
            v-model="settings.renamePattern"
            type="text"
            placeholder="e.g., IMG_{index}_{timestamp}"
            class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
          <button
            @click="showRenameHelp = !showRenameHelp"
            class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <QuestionMarkCircleIcon class="w-5 h-5" />
          </button>
        </div>
        <div v-if="showRenameHelp" class="mt-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
          <p class="font-medium mb-1">Available variables:</p>
          <ul class="space-y-1">
            <li><code>{index}</code> - Sequential number</li>
            <li><code>{timestamp}</code> - Current timestamp</li>
            <li><code>{original}</code> - Original filename (without extension)</li>
            <li><code>{width}x{height}</code> - New dimensions</li>
            <li><code>{format}</code> - Output format</li>
          </ul>
        </div>
      </div>
      
      <!-- EXIF Preservation -->
      <div class="flex items-center justify-between">
        <div>
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Preserve EXIF Data
          </label>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Keep original metadata (camera info, GPS, etc.)
          </p>
        </div>
        <button
          @click="settings.preserveExif = !settings.preserveExif"
          :class="[
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
            settings.preserveExif ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
          ]"
        >
          <span
            :class="[
              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200',
              settings.preserveExif ? 'translate-x-6' : 'translate-x-1'
            ]"
          />
        </button>
      </div>
      
      <!-- Watermark -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Watermark
        </label>
        <div class="space-y-3">
          <div class="flex items-center space-x-4">
            <label class="flex items-center">
              <input
                v-model="settings.watermark.enabled"
                type="checkbox"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable watermark</span>
            </label>
          </div>
          
          <div v-if="settings.watermark.enabled" class="space-y-3">
            <input
              v-model="settings.watermark.text"
              type="text"
              placeholder="Watermark text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            
            <div class="grid grid-cols-2 gap-3">
              <select
                v-model="settings.watermark.position"
                class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="top-right">Top Right</option>
                <option value="top-left">Top Left</option>
                <option value="center">Center</option>
              </select>
              
              <input
                v-model.number="settings.watermark.opacity"
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                class="w-full"
              />
            </div>
            
            <div class="text-xs text-gray-500 dark:text-gray-400">
              Opacity: {{ Math.round(settings.watermark.opacity * 100) }}%
            </div>
          </div>
        </div>
      </div>
      
      <!-- Progressive JPEG -->
      <div v-if="outputFormat === 'image/jpeg'" class="flex items-center justify-between">
        <div>
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Progressive JPEG
          </label>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Better loading experience for web
          </p>
        </div>
        <button
          @click="settings.progressive = !settings.progressive"
          :class="[
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
            settings.progressive ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
          ]"
        >
          <span
            :class="[
              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200',
              settings.progressive ? 'translate-x-6' : 'translate-x-1'
            ]"
          />
        </button>
      </div>
      
      <!-- Color Profile -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Color Profile
        </label>
        <select
          v-model="settings.colorProfile"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        >
          <option value="srgb">sRGB (Standard)</option>
          <option value="adobe-rgb">Adobe RGB</option>
          <option value="display-p3">Display P3</option>
          <option value="rec2020">Rec. 2020</option>
        </select>
      </div>
      
      <!-- Processing Priority -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Processing Priority
        </label>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="priority in ['speed', 'balanced', 'quality']"
            :key="priority"
            @click="settings.priority = priority"
            :class="[
              'p-2 text-sm rounded-lg border transition-all duration-200 capitalize',
              settings.priority === priority
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
            ]"
          >
            {{ priority }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { QuestionMarkCircleIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  outputFormat: {
    type: String,
    default: 'image/jpeg'
  }
})

const emit = defineEmits(['settings-changed'])

const isExpanded = ref(false)
const showRenameHelp = ref(false)

const settings = reactive({
  renamePattern: '',
  preserveExif: false,
  watermark: {
    enabled: false,
    text: '',
    position: 'bottom-right',
    opacity: 0.7
  },
  progressive: false,
  colorProfile: 'srgb',
  priority: 'balanced'
})

// Watch for settings changes and emit to parent
watch(settings, (newSettings) => {
  emit('settings-changed', { ...newSettings })
}, { deep: true })

// Emit initial settings
emit('settings-changed', { ...settings })
</script>
