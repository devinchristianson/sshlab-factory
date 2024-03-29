import { WebSocket } from 'ws'
import { type clientConfig } from "../types.js"

type WebSocketClient = {
  ws: WebSocket,
  config: clientConfig | {}
}

export class WebSocketGroups {
    groups: Map<string, WebSocketClient[]>;
    constructor() {
      // WARNING - this is a sparse array!
      this.groups = new Map<string, WebSocketClient[]>();
    }
    addClient(route: string, ws: WebSocket, config?: clientConfig) {
      if (ws.readyState === ws?.OPEN) {
        const group = (this.groups.get(route) ?? []);
        const index = group.push({
          "ws": ws,
          "config": config ?? {}
        }) - 1;
        //add cleanup callback
        ws.on("close",() => {
          delete group[index]
        })
        this.groups.set(route, group);
        return index;
      }
      return -1
    }
    updateClient(route: string, index: number, config: clientConfig) {
      const client = this.groups.get(route)?.[index];
      if (client) {
        client.config = config;
      }
    }
    send(route: string, where: Partial<clientConfig>, data: string | Buffer) {
      (this.groups.get(route) ?? []).forEach((client, index)=>{
        if (client.ws.readyState == client.ws?.OPEN && whereConfig(where, client.config)) {
          client.ws.send(data);
        }
      }) 
    }
}

function whereConfig(where: Partial<clientConfig>, config: clientConfig | {}): boolean {
    return Object.entries(where).reduce<boolean>((acc: boolean, [k,v])=>{
      return acc && v == config[k as keyof typeof config]
    },true)
}