<script setup lang="ts">
  const { logId } = defineProps<{logId: string}>()
  import { ref, onMounted } from 'vue';
  import * as AsciinemaPlayer from 'asciinema-player';
  import { usePlayerStore } from '../store';
  const store = usePlayerStore();
  const playerDiv = ref(null);
  let player: any;
  const createPlayer = () => AsciinemaPlayer.create(
    store.getWebSocketLocation(logId),
    playerDiv.value,
    { cols: 81, rows: 20, fit: "both", logger: console, autoPlay: true, ...(store.$state.fastforward ? {idleTimeLimit: 1} : {})}
  );
  onMounted(()=>{
    player = createPlayer();
  })
  store.$onAction(({name})=>{
    if (name=="resetPlayers") {
      player.dispose();
      player = createPlayer();
    }
  })
</script>

<template>
  <div ref="playerDiv"></div>
</template>