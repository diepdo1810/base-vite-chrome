<script setup>
// No props or emits needed for now
</script>

<template>
  <div class="flex justify-between items-center px-4 py-2 bg-gray-800 border-b border-gray-600">
    <h1 class="text-sm font-normal text-gray-300 m-0">
      CHAT
    </h1>

    <div class="flex gap-1">
      <button
        v-for="icon in ['↻', '⋯', '✕']"
        :key="icon"
        class="bg-transparent border-none text-gray-300 cursor-pointer px-2 py-1 rounded text-sm hover:bg-gray-600 transition-colors"
      >
        {{ icon }}
      </button>
    </div>
  </div>
</template>
