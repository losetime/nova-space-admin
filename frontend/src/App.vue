<script setup lang="ts">
</script>

<template>
  <a-config-provider
    :theme="{
      token: {
        colorPrimary: '#1890ff',
      },
    }"
  >
    <router-view />
  </a-config-provider>
</template>

<style>
body {
  margin: 0;
  padding: 0;
  background-color: #f0f2f5;
}
</style>