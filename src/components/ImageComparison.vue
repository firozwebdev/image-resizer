<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <!-- Backdrop -->
    <div 
      class="fixed inset-0 bg-black/90 backdrop-blur-sm transition-opacity"
      @click="$emit('close')"
    ></div>
    
    <!-- Modal -->
    <div class="flex min-h-full items-center justify-center p-4">
      <div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white truncate">
              Image Comparison: {{ image.file.name }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Compare original and processed versions
            </p>
          </div>
          <button
            @click="$emit('close')"
            class="ml-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <XMarkIcon class="w-5 h-5" />
          </button>
        </div>
        
        <!-- Comparison Controls -->
        <div class="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <button
                @click="viewMode = 'side-by-side'"
                :class="[
                  'px-3 py-2 text-sm rounded-lg transition-colors',
                  viewMode === 'side-by-side'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500'
                ]"
              >
                Side by Side
              </button>
              <button
                @click="viewMode = 'overlay'"
                :class="[
                  'px-3 py-2 text-sm rounded-lg transition-colors',
                  viewMode === 'overlay'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500'
                ]"
              >
                Overlay
              </button>
              <button
                @click="viewMode = 'slider'"
                :class="[
                  'px-3 py-2 text-sm rounded-lg transition-colors',
                  viewMode === 'slider'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500'
                ]"
              >
                Slider
              </button>
            </div>
            
            <div class="flex items-center space-x-4">
              <div class="text-sm text-gray-600 dark:text-gray-400">
                Zoom: {{ Math.round(zoomLevel * 100) }}%
              </div>
              <div class="flex items-center space-x-2">
                <button
                  @click="zoomOut"
                  class="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <MinusIcon class="w-4 h-4" />
                </button>
                <button
                  @click="resetZoom"
                  class="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 rounded"
                >
                  Reset
                </button>
                <button
                  @click="zoomIn"
                  class="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <PlusIcon class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Image Comparison Area -->
        <div class="relative overflow-auto max-h-[60vh] bg-gray-100 dark:bg-gray-900">
          <!-- Side by Side View -->
          <div v-if="viewMode === 'side-by-side'" class="grid grid-cols-2 gap-4 p-4">
            <div class="text-center">
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Original</h4>
              <div class="relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                <img
                  :src="originalUrl"
                  :alt="image.file.name"
                  :style="{ transform: `scale(${zoomLevel})` }"
                  class="w-full h-auto transition-transform duration-200 origin-center"
                />
              </div>
            </div>
            <div class="text-center">
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Processed</h4>
              <div class="relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                <img
                  :src="image.previewUrl"
                  :alt="image.file.name"
                  :style="{ transform: `scale(${zoomLevel})` }"
                  class="w-full h-auto transition-transform duration-200 origin-center"
                />
              </div>
            </div>
          </div>
          
          <!-- Overlay View -->
          <div v-else-if="viewMode === 'overlay'" class="relative p-4">
            <div class="relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg mx-auto max-w-4xl">
              <img
                :src="originalUrl"
                :alt="image.file.name"
                :style="{ transform: `scale(${zoomLevel})` }"
                class="w-full h-auto transition-transform duration-200 origin-center"
              />
              <img
                :src="image.previewUrl"
                :alt="image.file.name"
                :style="{ 
                  transform: `scale(${zoomLevel})`,
                  opacity: overlayOpacity
                }"
                class="absolute inset-0 w-full h-auto transition-all duration-200 origin-center"
              />
            </div>
            <div class="mt-4 flex items-center justify-center space-x-4">
              <span class="text-sm text-gray-600 dark:text-gray-400">Original</span>
              <input
                v-model.number="overlayOpacity"
                type="range"
                min="0"
                max="1"
                step="0.1"
                class="w-32"
              />
              <span class="text-sm text-gray-600 dark:text-gray-400">Processed</span>
            </div>
          </div>
          
          <!-- Slider View -->
          <div v-else-if="viewMode === 'slider'" class="relative p-4">
            <div class="relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg mx-auto max-w-4xl">
              <div class="relative overflow-hidden">
                <img
                  :src="originalUrl"
                  :alt="image.file.name"
                  :style="{ transform: `scale(${zoomLevel})` }"
                  class="w-full h-auto transition-transform duration-200 origin-center"
                />
                <div 
                  class="absolute inset-0 overflow-hidden"
                  :style="{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }"
                >
                  <img
                    :src="image.previewUrl"
                    :alt="image.file.name"
                    :style="{ transform: `scale(${zoomLevel})` }"
                    class="w-full h-auto transition-transform duration-200 origin-center"
                  />
                </div>
                
                <!-- Slider Handle -->
                <div 
                  class="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
                  :style="{ left: `${sliderPosition}%` }"
                  @mousedown="startSliderDrag"
                >
                  <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-lg border-2 border-blue-500"></div>
                </div>
              </div>
            </div>
            <div class="mt-4 text-center">
              <input
                v-model.number="sliderPosition"
                type="range"
                min="0"
                max="100"
                class="w-64"
              />
            </div>
          </div>
        </div>
        
        <!-- Stats Comparison -->
        <div class="p-4 border-t border-gray-200 dark:border-gray-700">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div class="text-center">
              <div class="text-gray-500 dark:text-gray-400">Original Size</div>
              <div class="font-medium text-gray-900 dark:text-white">
                {{ formatFileSize(image.result.originalSize) }}
              </div>
            </div>
            <div class="text-center">
              <div class="text-gray-500 dark:text-gray-400">New Size</div>
              <div class="font-medium text-gray-900 dark:text-white">
                {{ formatFileSize(image.result.newSize) }}
              </div>
            </div>
            <div class="text-center">
              <div class="text-gray-500 dark:text-gray-400">Dimensions</div>
              <div class="font-medium text-gray-900 dark:text-white">
                {{ image.result.originalDimensions.width }}×{{ image.result.originalDimensions.height }} → 
                {{ image.result.newDimensions.width }}×{{ image.result.newDimensions.height }}
              </div>
            </div>
            <div class="text-center">
              <div class="text-gray-500 dark:text-gray-400">Compression</div>
              <div class="font-medium text-green-600 dark:text-green-400">
                -{{ image.result.compressionRatio }}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { XMarkIcon, MinusIcon, PlusIcon } from '@heroicons/vue/24/outline'
import { formatFileSize } from '../utils/imageProcessor.js'

const props = defineProps({
  image: {
    type: Object,
    required: true
  }
})

defineEmits(['close'])

const viewMode = ref('side-by-side')
const zoomLevel = ref(1)
const overlayOpacity = ref(0.5)
const sliderPosition = ref(50)
const originalUrl = ref('')

const zoomIn = () => {
  zoomLevel.value = Math.min(zoomLevel.value * 1.2, 5)
}

const zoomOut = () => {
  zoomLevel.value = Math.max(zoomLevel.value / 1.2, 0.1)
}

const resetZoom = () => {
  zoomLevel.value = 1
}

const startSliderDrag = (e) => {
  const container = e.target.closest('.relative')
  const rect = container.getBoundingClientRect()
  
  const updateSlider = (clientX) => {
    const x = clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    sliderPosition.value = percentage
  }
  
  const onMouseMove = (e) => updateSlider(e.clientX)
  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }
  
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

onMounted(() => {
  // Create original image URL
  const reader = new FileReader()
  reader.onload = (e) => {
    originalUrl.value = e.target.result
  }
  reader.readAsDataURL(props.image.file)
})
</script>
