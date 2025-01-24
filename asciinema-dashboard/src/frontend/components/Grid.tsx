import Player from "./Player";
import { serverMessageSchema, type clientMessage } from "../../types";
import { extractPlayerValues, usePlayerStore } from "../store";
import { useState } from "react";
function Grid() {
  const [streams, setStreams] = useState<string[]>([]) 
  const store = usePlayerStore();
  const ws = new WebSocket(store.getWebSocketLocation());
  ws.onopen = () => {
    ws.send(JSON.stringify({
      action: "start",
      options: extractPlayerValues(store)
    } as clientMessage));
    usePlayerStore.subscribe((state)=>{
      ws.send(JSON.stringify({
        action: "update",
        options: extractPlayerValues(state)
      } as clientMessage));
    })
  }
  ws.onmessage = (e) => {
    const msg = serverMessageSchema.parse(JSON.parse(e.data));
    switch (msg.action) {
      case "start":
        setStreams(streams.concat([msg.name]))
        break;
      case "end":
        const index = streams.indexOf(msg.name)
        setStreams([...streams.slice(0, index), ...streams.slice(index + 1)])    
        break;
    }
  }
  return (
    <div className={`grid auto-rows-fr grid-cols-${(streams.length == 1 ? 1 : 4 )} w-full gap-4 p-4 grow basis-3/4`}>
    {streams.map((stream) => <Player logId={stream}/>)}
    </div>
  );
}

export default Grid;