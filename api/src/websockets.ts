import { IncomingMessage } from "http";
import { Server } from "node:http";
import { WebSocketServer } from "ws";
import { authenticateIncomingMessage } from "./auth.js";
import { wsBasePath } from "./routes/routes.js";
import { ChatRoomManager } from "./types/chat-room.js";

export function addWebsockets(server: Server) {

	const wss = new WebSocketServer({ noServer: true });

	server.on("upgrade", async (incomingMessage, duplex, buffer) => {
		duplex.on("error", (err) => console.error(err));

		try {

			await authenticateIncomingMessage(incomingMessage);

			if (incomingMessage.url!.startsWith(`${wsBasePath}/messages`)) {
				wss.handleUpgrade(incomingMessage, duplex, buffer, (ws) => {
					wss.emit('connection', ws, incomingMessage);
				});
			} else {
				throw new Error(`Unexpected websocket url: ${incomingMessage.url}`);
			}

		} catch (err) {
			duplex.destroy(err);
		}
	});

	const manager = new ChatRoomManager();

	wss.on('connection', (ws, incomingMessage) => {

		const userId = incomingMessage["userId"];
		const discussionId = _getFromIncomingMessageQuery<string>("discussionId", incomingMessage);

		manager.joinOrCreateRoom(discussionId, userId, ws);

		// heartbeat to keep the connection alive
		// otherwise nginx timeouts after 60s
		const pingId = setInterval(() => ws.ping(), 30000);

		ws.on("close", () => {
			clearInterval(pingId);  // stop ping loop
            manager.leaveRoom(discussionId, userId);
		});

	});

}


function _getFromIncomingMessageQuery<T>(key: string, incomingMessage: IncomingMessage): T {
	const url = new URL(incomingMessage.url, `http://${incomingMessage.headers.host}`);
	const value = url.searchParams.get(key);
	if (!value) { throw new Error(`${key} not found in request query parameters`); }
	return value as T;
}

