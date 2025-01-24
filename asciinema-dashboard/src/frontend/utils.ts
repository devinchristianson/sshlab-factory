import { createTRPCReact } from '@trpc/react-query';
 
export function getWebsocketLocation(logId="") {
        const origin = (import.meta.env.MODE == "development" ? "http://localhost:3001" : window.location.origin);
        return `${origin.replace(/^http/, "ws")}/ws/${logId}`
}

import type { ApiRouter } from '../backend/api.js';

export const trpc = createTRPCReact<ApiRouter>();
