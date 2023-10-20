<script setup lang="ts">
  const { logId } = defineProps<{logId: string}>()
  import { ref, onMounted } from 'vue';
  import { getWebsocketLocation } from '../utils';
  import * as AsciinemaPlayer from 'asciinema-player';
  import { usePlayerStore } from '../store';
  const store = usePlayerStore();
  const playerDiv = ref(null);
  let player: any;
  const createPlayer = () => AsciinemaPlayer.create(
    `${getWebsocketLocation(logId)}`,
    playerDiv.value,
    { cols: 81, rows: 20, logger: console, autoPlay: true, ...(store.$state.fastforward ? {idleTimeLimit: 1} : {})}
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