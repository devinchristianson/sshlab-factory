import express from 'express';
import expressWs from 'express-ws';
import { WebSocket } from 'ws'
import path from 'path';
import { WebSocketGroups } from './WebSocketGroups';
import { Tail } from "tail";
import dotenv from 'dotenv'
import * as fs from "fs";
import * as chokidar from "chokidar"
import { clientMessageSchema, type serverMessage } from '../types';
dotenv.config()

const { app } = expressWs(express());
const router = express.Router() as expressWs.Router;

const clients = new WebSocketGroups()

const files = {
  active: new Set<string>(),
  exited: new Set<string>(),
};

const logPath = process.env.SRC_LOG_DIR ?? "/tmp/logs";
///\rexit\r\n"]
const endSequence = /[\\r\\n]exit\\r\\n"]/;

const watcher = chokidar.watch(logPath, {
  ignored: /.accesstest/
});

watcher.on("ready", () => {
  console.log(`⚡️[server]: Main file watcher is up and running!`);
})

watcher.on("add", (path) => {
  const file = path.split("/").at(-1) ?? "";
  if (!endSequence.test(fs.readFileSync(path).toString().split('\n').at(-2) ?? "")) {
    const tail = new Tail(path);
    tail.on("line", (data: string)=>{
      
      // send to clients regardless
      clients.send(`/${file}`, {}, data);

      // if session has exited
      if (endSequence.test(data)) {
        console.log("session has ended!");
        
        // remove from the list of active sessions
        files.active.delete(file);
        files.exited.add(file);

        // let clients know it's done
        clients.send("/", {includeExited: false}, JSON.stringify({
          action: "end",
          name: file
        }));

        // remove watcher
        tail.unwatch();
      }
    })
    tail.on("error", (err) => {
      console.log(err); 
    })
    files.active.add(file);
    // let clients know a new session has started
    clients.send("/", {}, JSON.stringify({
      action: "start",
      name: file
    }));
  } else {
    console.log(`Session in ${path} already ended, skipping`);
  }
})

router.ws('/', (ws, req) => {
  let index = -1;
  ws.on("message", (data)=>{
    const msg = clientMessageSchema.parse(JSON.parse(data.toString()))
    switch (msg.action) {
      case "start":
        for (const file of files.active.keys()) {
          ws.send(JSON.stringify({
            action: "start",
            name: file,
            exited: false
          } as serverMessage));
        }
        if (msg.options?.includeExited) {
          for (const file of files.exited.keys()) {
            ws.send(JSON.stringify({
              action: "start",
              name: file,
              exited: true
            } as serverMessage));
          }
        }
        break;
      case "update":
        if (index !=-1) {
          clients.updateClient("/", index, msg.options);
        } else {
          console.error("client requested update failed due to lack of index");
        }
        break;
    }
    index = clients.addClient("/", ws, msg.options);
  })

});

const sendFile = (ws: WebSocket, file: string) => {
      const lines = fs.readFileSync(path.join(logPath, file)).toString().split('\n');
      for (const line of lines) {
        if (line) {
          ws.send(line);
        }
      }
}

router.ws('/:file', (ws, req) => {
  const params = new URLSearchParams(req.path.split("?").at(-1));
  const file = req.params.file;
  if (files.active.has(req.params.file)) {
    if (params.has("fastforward") && params.get("fastforward")) {
      sendFile(ws, file);
    }
    clients.addClient(`/${req.params.file}`, ws);
  } else if (files.exited.has(req.params.file)) {
    // fast forward would skip exited sessions entirely, so we don't need to check it here
    sendFile(ws, file);
  }
});

app.use(express.static(path.join(__dirname, 'public')));
app.use("/ws", router);

const port = process.env.PORT ?? "3001";
app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});