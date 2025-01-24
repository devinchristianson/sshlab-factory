import type { Session } from "@auth/express";

export function getWebsocketLocation(logId="") {
        const origin = (import.meta.env.MODE == "development" ? "http://localhost:3001" : window.location.origin);
        return `${origin.replace(/^http/, "ws")}/ws/${logId}`
}

import type { ApiRouter } from '../backend/api.js';

import { createTRPCProxyClient } from '@trpc/client'
import { httpBatchLink } from '@trpc/client/links/httpBatchLink'

export const trpc = createTRPCProxyClient<ApiRouter>({
    links: [httpBatchLink({ url:`${location.protocol}//${location.host}/api` })],
})