<script setup lang="ts">
import { ClipboardDocumentIcon } from '@heroicons/vue/24/solid';
import { type toptMessage } from "../../types";
import { ref } from "vue";
const totp = ref<string>();
const timeUntilExpiry = ref<number>();
const animation = ref<SVGAnimateElement>();
const fetchTotp = () => {
  fetch("/totp").then((response) => {
    response.json().then((data: toptMessage) => {
      totp.value = data.otp
      timeUntilExpiry.value = (data.expires - Date.now()) // calculate milliseconds til expiry
      animation.value?.beginElement() // play the animation
      setTimeout(fetchTotp, (data.expires - Date.now())) // fetch new totp when this one expires
    }).catch((error) => {
      console.error(error)
    })
  }).catch((error) => {
    console.error(error)
  })
  
}
const copyOtp = async () => {
  if (totp.value) {
    await navigator.clipboard.writeText(totp.value)
  }
}
fetchTotp() // fetch initial totp
</script>

<template>
  <div class="flex flex-row gap-2">
    Copy OTP:
    <ClipboardDocumentIcon @click="copyOtp" class="h-6 w-6 text-blue-500 cursor-pointer" />
    <svg class="h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
      version="1.1" viewBox="30 30 140 140" preserveAspectRatio="none" style="width: 100; height: 100; top: 0; left: 0">
      <circle cx="100" cy="100" r="50" fill="none" stroke="currentColor" stroke-width="25" stroke-dasharray="315,20000"
        transform="rotate(-90,100,100)" stroke-linecap="round">
        <animate ref="animation" repeatCount="1" restart="always" attributeName="stroke-dasharray"
          values="315,20000;0,20000" :dur="(timeUntilExpiry && timeUntilExpiry > 0 ? (timeUntilExpiry / 1000) : 0)" />
      </circle>
    </svg>
  </div>

</template>