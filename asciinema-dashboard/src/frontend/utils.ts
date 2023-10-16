export function getWebsocketLocation(logId="") {
        const origin = (import.meta.env.MODE == "development" ? "http://localhost:3001" : window.location.origin);
        return `${origin.replace(/^http/, "ws")}/ws/${logId}`
}