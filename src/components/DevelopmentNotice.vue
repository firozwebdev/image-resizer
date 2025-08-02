<template>
  <div v-if="showNotice" class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
    <div class="flex items-start space-x-3">
      <div class="flex-shrink-0">
        <InformationCircleIcon class="w-5 h-5 text-blue-600 dark:text-blue-400" />
      </div>
      <div class="flex-1">
        <h3 class="text-sm font-medium text-blue-800 dark:text-blue-200">
          Development Mode
        </h3>
        <p class="mt-1 text-sm text-blue-700 dark:text-blue-300">
          Server-side processing functions are not available in local development. 
          The app will automatically use client-side processing for optimal performance.
        </p>
        <div class="mt-3 flex items-center space-x-4">
          <button
            @click="showNotice = false"
            class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium"
          >
            Got it
          </button>
          <a
            href="https://docs.netlify.com/functions/overview/"
            target="_blank"
            rel="noopener noreferrer"
            class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium"
          >
            Learn about Netlify Functions →
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { InformationCircleIcon } from '@heroicons/vue/24/outline';

const showNotice = ref(false);

onMounted(() => {
  // Show notice only in development (when running on localhost)
  const isDevelopment = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.includes('localhost');
  
  // Check if user has already dismissed the notice
  const hasSeenNotice = localStorage.getItem('dev-notice-dismissed');
  
  showNotice.value = isDevelopment && !hasSeenNotice;
});

// Save dismissal state
const dismissNotice = () => {
  showNotice.value = false;
  localStorage.setItem('dev-notice-dismissed', 'true');
};
</script>
