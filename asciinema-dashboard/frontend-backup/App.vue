<script setup lang="ts">
  import { RouterView } from "vue-router";
  import ToolBar from "./components/ToolBar.vue";
</script>


<template>
  <div class="min-h-full flex flex-col bg-gray-800">
      <ToolBar/>
      <RouterView/>
    </div>
</template>