<script setup lang="ts">
  import Player from "./Player.vue"
  import { getWebsocketLocation } from '../utils'
  import { ref } from "vue";
  import { serverMessageSchema, type clientMessage } from "../../types";
  import { usePlayerStore } from "../store";
  const sessions = ref<string[]>([])
  const store = usePlayerStore()
  const ws = new WebSocket(getWebsocketLocation())
  ws.onopen = (e) => {
    ws.send(JSON.stringify({
      action: "start",
      options: store.$state
    } as clientMessage))
    store.$subscribe((_, state)=>{
      ws.send(JSON.stringify({
        action: "update",
        options: state
      } as clientMessage))
    })
  }
  ws.onmessage = (e) => {
    const msg = serverMessageSchema.parse(JSON.parse(e.data));
    switch (msg.action) {
      case "start":
          sessions.value.push(msg.name)
          break;
      case "end":
          sessions.value.splice(sessions.value.indexOf(msg.name), 1)
          break;
    }
  }
</script>


<template>
    <div :class="`grid grid-cols-4 gap-4 p-4 bg-gray-800 min-h-full`">
      <Player class="max-h-5 max-w-5" v-for="session in sessions" :log-id="session"/>
    </div>
</template>