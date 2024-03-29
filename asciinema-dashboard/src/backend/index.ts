import express from 'express';
import { WebSocket } from 'ws'
import path from 'path';
import { Tail } from "tail";
import dotenv from 'dotenv'
import * as fs from "fs";
import * as chokidar from "chokidar"
import { ExpressAuth, Session, getSession } from "@auth/express"
import { TOTP } from "totp-generator"
import { base32Encode } from "@ctrl/ts-base32"
import { fileURLToPath } from 'url';
import { Server, IncomingMessage, ServerResponse } from 'http';

import { WebSocketGroups } from './WebSocketGroups.js';
import { clientMessageSchema, type serverMessage } from '../types.js';
import {authenticatedUser, useSession } from './middleware.js'
import { authConfig } from './auth.config.js';

// set up the express http and websocket server
dotenv.config()

import { WebSocketServer } from 'ws';

const app  = express();

const clients = new WebSocketGroups()
// initialize global vars
const files = {
  active: new Set<string>(),
  exited: new Set<string>(),
};

const logPath = process.env.SRC_LOG_DIR ?? "/tmp/logs";
///\rexit\r\n"]
const endSequence = /\\r\\n(exit)|(logout)\\r\\n/;

// set up the file watcher
const watcher = chokidar.watch(logPath, {
  ignored: /.accesstest/
});

watcher.on("ready", () => {
  console.log(`⚡️[server]: Main file watcher is up and running!`);
})

watcher.on("add", (path) => {
  const file = path.split("/").at(-1) ?? "";
  let exited = false
  fs.readFileSync(path).toString().split('\n').forEach((l)=>{
    exited = exited && endSequence.test(l)
  })
  if (!exited) {
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


// set up auth and routes

const enc = new TextEncoder(); // always utf-8

app.set('trust proxy',true)
app.use("/auth/*", ExpressAuth(authConfig))
app.use("/totp", useSession, async function(_, res) {
  const username = (res.locals.session as Session).user?.email
  if ( username ) {
    const totp = TOTP.generate(base32Encode(enc.encode(username + process.env.JWT_SECRET), 'RFC4648'), {
      algorithm: "SHA-256"
    })
    console.log(totp)
    res.status(200).json(totp)
  } else {
    res.status(400)
  }
})
app.use("/session", useSession, async function(_, res) {
  const session = (res.locals.session as Session | undefined)
  if ( session ) {
    res.status(200).json(session)
  } else {
    res.status(400).json({})
  }
})
app.use("/", express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), 'public')));

const port = process.env.PORT ?? "3001";
let server:Server<typeof IncomingMessage, typeof ServerResponse>;
server = app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
const listServer = new WebSocketServer({ noServer: true });
listServer.on('connection', function(ws: WebSocket, req: IncomingMessage, session: Session) {
  ws.on("error", console.error)
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
})
const sendFile = (ws: WebSocket, file: string, onlyFirst=false) => {
  const lines = fs.readFileSync(path.join(logPath, file)).toString().split('\n');
  if (onlyFirst) {
    ws.send(lines[0])
  } else {
    for (const line of lines) {
      if (line) {
        ws.send(line);
      }
    }
  }
}
const fileServer = new WebSocketServer({ noServer: true });
fileServer.on('connection', function(ws: WebSocket, req: IncomingMessage, session: Session,file: string, paramsString: string) {
  ws.on("error", console.error)
  const params = new URLSearchParams(paramsString);
  if (files.active.has(file)) {
    if (params.get("fastforward") == 'true') {
      sendFile(ws, file);  // catch client up with current by sending the whole file
    } else {
      sendFile(ws, file, true) // send only first line as it's important for initialization
    }
    // add client to watcher for live-streamed events
    clients.addClient(`/${file}`, ws);
  } else if (files.exited.has(file)) {
    // fast forward would skip exited sessions entirely, so we don't need to check it here
    sendFile(ws, file);
  }
})
server.on('upgrade', async function upgrade(request, socket, head) {
  socket.on('error', console.error);
  const session = await getSession(request as express.Request, authConfig) 
  if (session) {
    socket.removeListener('error', console.error);
    if (request.url == '/ws/') {
      listServer.handleUpgrade(request, socket, head, function done(ws) {
        listServer.emit('connection', ws, request, session);
      });
      return
    }
    const [filename, params] = request.url?.split("/")?.slice(-1)[0].split("?") ?? []
    if (filename && files.active.has(filename)) {
      fileServer.handleUpgrade(request, socket, head, function done(ws) {
        fileServer.emit('connection', ws, request, session, filename, params);
      });
      return
    }
  }
  socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
  socket.destroy();
})


const shutdownHandler = () => {
  console.log(`⚡️[server]: Closing all connections`);
  fileServer.close(()=>{
    console.log(`⚡️[server]: File Websocket server is shut down`);
  })
  listServer.close(()=>{
    console.log(`⚡️[server]: List Websocket server is shut down`);
  })
  server.closeAllConnections();
  server.removeAllListeners();
  server.close(()=>{
    console.log(`⚡️[server]: HTTP Server has stopped accepting connections`);
  });
  console.log(`⚡️[server]: Shutting down.`);
  process.exit(0)
}
process.on('SIGTERM', shutdownHandler)
process.on('SIGINT', shutdownHandler)