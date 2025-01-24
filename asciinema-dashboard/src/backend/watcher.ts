import * as chokidar from "chokidar"
import * as fs from "fs";
import * as uuid from "uuid"
import { Tail } from "tail";
import { WebSocketGroups } from "./WebSocketGroups.js";
import * as z from 'zod'
import { hexToArrayBuffer } from "@ctrl/ts-base32";
export class Watcher {
    files = {
        active: new Set<string>(),
        exited: new Set<string>(),
    };
    endSequence = /\\r\\n(exit)|(logout)\\r\\n/;
    logPath: string;
    watcher: chokidar.FSWatcher;
    constructor(clients: WebSocketGroups, logPath: string) {
        this.logPath = logPath;
        this.watcher = chokidar.watch(this.logPath, {
            ignored: /.accesstest/
        });
        this.watcher.on("ready", () => {
            console.log(`⚡️[server]: Main file watcher is up and running!`);
        })

        this.watcher.on("add", (path) => {
            const file = path.split("/").at(-1) ?? "";
            let exited = false
            fs.readFileSync(path).toString().split('\n').forEach((l) => {
                exited = exited && this.endSequence.test(l)
            })
            if (!exited) {
                let start: Date;
                const tail = new Tail(path);
                // we happen to know that ContainerSSH makes the filename hex-encoded binary of a UUID
                // so do decode we need to do hex -> byte array -> UUID string
                const streamId = uuid.stringify(new Uint8Array(hexToArrayBuffer(file)))
                let lineNum = 0;
                
                tail.on("line", (data: string) => {
                    // send to clients regardless
                    clients.send(`/${file}`, {}, data);

                    // if session has exited
                    if (this.endSequence.test(data)) {
                        console.log("session has ended!");

                        // remove from the list of active sessions
                        this.files.active.delete(file);
                        this.files.exited.add(file);

                        // let clients know it's done
                        clients.send("/", { includeExited: false }, JSON.stringify({
                            action: "end",
                            name: file
                        }));

                        // remove watcher
                        tail.unwatch();
                    }
                    lineNum++
                })
                tail.on("error", (err) => {
                    console.log(err);
                })
                this.files.active.add(file);
                // let clients know a new session has started
                clients.send("/", {}, JSON.stringify({
                    action: "start",
                    name: file
                }));
            } else {
                console.log(`Session in ${path} already ended, skipping`);
            }
        })
    }
    close() {
        this.watcher.close()
    }
}

// {"version":2,"width":212,"height":28,"timestamp":1717284694,"command":"/bin/sh","title":"","env":{"TERM":"xterm-256color"}}
const headerSchema = z.object({
    version: z.number(),
    width: z.number(),
    height: z.number(),
    timestamp: z.number(),
    command: z.string(),
    title: z.string(),
    env: z.record(z.string())
})
type Header = z.infer<typeof headerSchema>

const eventSchema = z.array(z.union([z.string(), z.number()])).min(3).refine((a) => {
    return typeof a[0] == "number"
})
type event = z.infer<typeof eventSchema>