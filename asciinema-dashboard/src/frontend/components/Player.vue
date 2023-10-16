<script setup lang="ts">
  const { logId } = defineProps<{logId: string}>()
  import { ref, onMounted } from 'vue';
  import { getWebsocketLocation } from '../utils'
  import * as AsciinemaPlayer from 'asciinema-player';
  import { usePlayerStore } from '../store';
  const store = usePlayerStore();
  const player = ref(null);
  onMounted(()=>{
    console.log(getWebsocketLocation(logId))
    const p = AsciinemaPlayer.create(
        `${getWebsocketLocation(logId)}`,
        player.value,
        { cols: 81, rows: 20, logger: console, idleTimeLimit: 1, autoPlay: true});
    p.addEventListener('ended', () => {
      console.log("ended!");
    })
  })
  
</script>

<template>
  <div ref="player"></div>
</template>