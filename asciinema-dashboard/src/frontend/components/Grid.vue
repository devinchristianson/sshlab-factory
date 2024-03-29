<script setup lang="ts">
  import Player from "./Player.vue";
  import { ref } from "vue";
  import { serverMessageSchema, type clientMessage } from "../../types";
  import { usePlayerStore } from "../store";
  const streams = ref<string[]>([]);
  const store = usePlayerStore();
  const ws = new WebSocket(store.getWebSocketLocation());
  ws.onopen = (e) => {
    ws.send(JSON.stringify({
      action: "start",
      options: store.$state
    } as clientMessage));
    store.$subscribe((_, state)=>{
      ws.send(JSON.stringify({
        action: "update",
        options: state
      } as clientMessage));
    });
  }
  ws.onmessage = (e) => {
    const msg = serverMessageSchema.parse(JSON.parse(e.data));
    switch (msg.action) {
      case "start":
          streams.value.push(msg.name);
          break;
      case "end":
          streams.value.splice(streams.value.indexOf(msg.name), 1);
          break;
    }
  }
</script>


<template>
    <div :class="`grid auto-rows-fr grid-cols-${(streams.length == 1 ? 1 : 4 )} w-full gap-4 p-4 grow basis-3/4`">
      <Player v-for="stream in streams" :log-id="stream"/>
    </div>
</template>