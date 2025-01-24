
import * as AsciinemaPlayer from 'asciinema-player';
import { usePlayerStore } from '../store'
import { useEffect, useRef } from 'react';
function Player({ logId }: { logId: string }) {
  const store = usePlayerStore();
  const playerDiv = useRef<HTMLDivElement>(null);
  let player: any;
  const createPlayer = () => AsciinemaPlayer.create(
    store.getWebSocketLocation(logId),
    playerDiv,
    { cols: 81, rows: 20, fit: "both", logger: console, autoPlay: true, ...(store.fastforward ? {idleTimeLimit: 1} : {})}
  );
  useEffect(()=>{
    player = createPlayer();
  }, [])
  usePlayerStore.subscribe(
    (state) => state.resetCounter,
    ()=>{
      player.dispose();
      player = createPlayer();
    }
  )
  return <div ref={playerDiv}></div>
}

export default Player;