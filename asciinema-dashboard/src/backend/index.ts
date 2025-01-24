import express from 'express';
import { WebSocket } from 'ws'
import path from 'path';
import dotenv from 'dotenv'
import * as fs from "fs";
import { trpcApi } from './api.js'
import { ExpressAuth, Session, getSession } from "@auth/express"
import { TOTP } from "totp-generator"
import { base32Encode } from "@ctrl/ts-base32"
import { fileURLToPath } from 'url';
import { Server, IncomingMessage, ServerResponse } from 'http';

import { WebSocketGroups } from './WebSocketGroups.js';
import { clientMessageSchema, type serverMessage } from '../types.js';
import { authenticatedUser, useSession, useUsername } from './middleware.js'
import { authConfig } from './auth.config.js';
import { ENV } from './env.config.js';

// set up the express http and websocket server
dotenv.config()

import { WebSocketServer } from 'ws';
import { Watcher } from './watcher.js';
import { acceptedUserManager, pendingUserManager, UserManager } from './redis.js';
import { GitHubProfile } from '@auth/express/providers/github';

const app = express();

const clients = new WebSocketGroups()

const watcher = new Watcher(clients, ENV.SRC_LOG_DIR ?? "/tmp/logs");


// set up auth and routes

const enc = new TextEncoder(); // always utf-8

app.set('trust proxy', true)
app.use("/auth/*", ExpressAuth(authConfig))
app.use(
  '/api',
  trpcApi,
);
app.use('/markdown/*', (req, res, next) => {
  // check if the requested file ends with "md", otherwise return 404
  const extension = ((req.params as any)?.['0'] ?? '').split('.').pop()
  if (extension != 'md' ) {
    res.sendStatus(404)
  } else {
    next()
  }
})
app.use("/", express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), 'public')));

app.use("*", function (req, res) {
  res.sendFile(path.join(path.dirname(fileURLToPath(import.meta.url)), 'public', 'index.html'))
})
const port = ENV.PORT ?? "3001";
let server: Server<typeof IncomingMessage, typeof ServerResponse>;
server = app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
const listServer = new WebSocketServer({ noServer: true });
listServer.on('connection', function (ws: WebSocket, req: IncomingMessage, session: Session) {
  ws.on("error", console.error)
  let index = -1;
  ws.on("message", (data) => {
    const msg = clientMessageSchema.parse(JSON.parse(data.toString()))
    switch (msg.action) {
      case "start":
        for (const file of watcher.files.active.keys()) {
          ws.send(JSON.stringify({
            action: "start",
            name: file,
            exited: false
          } as serverMessage));
        }
        if (msg.options?.includeExited) {
          for (const file of watcher.files.exited.keys()) {
            ws.send(JSON.stringify({
              action: "start",
              name: file,
              exited: true
            } as serverMessage));
          }
        }
        break;
      case "update":
        if (index != -1) {
          clients.updateClient("/", index, msg.options);
        } else {
          console.error("client requested update failed due to lack of index");
        }
        break;
    }
    index = clients.addClient("/", ws, msg.options);
  })
})
const sendFile = (ws: WebSocket, file: string, onlyFirst = false) => {
  const lines = fs.readFileSync(path.join(watcher.logPath, file)).toString().split('\n');
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
fileServer.on('connection', function (ws: WebSocket, req: IncomingMessage, session: Session, file: string, paramsString: string) {
  ws.on("error", console.error)
  const params = new URLSearchParams(paramsString);
  if (watcher.files.active.has(file)) {
    if (params.get("fastforward") == 'true') {
      sendFile(ws, file);  // catch client up with current by sending the whole file
    } else {
      sendFile(ws, file, true) // send only first line as it's important for initialization
    }
    // add client to watcher for live-streamed events
    clients.addClient(`/${file}`, ws);
  } else if (watcher.files.exited.has(file)) {
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
    if (filename && watcher.files.active.has(filename)) {
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
  fileServer.close(() => {
    console.log(`⚡️[server]: File Websocket server is shut down`);
  })
  listServer.close(() => {
    console.log(`⚡️[server]: List Websocket server is shut down`);
  })
  watcher.close()
  server.closeAllConnections();
  server.removeAllListeners();
  server.close(() => {
    console.log(`⚡️[server]: HTTP Server has stopped accepting connections`);
  });
  console.log(`⚡️[server]: Shutting down.`);
  process.exit(0)
}
process.on('SIGTERM', shutdownHandler)
process.on('SIGINT', shutdownHandler)

export const viteNodeApp = app;