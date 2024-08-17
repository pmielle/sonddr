import { IncomingMessage } from "http";
import { Server } from "node:http";
import { WebSocketServer } from "ws";
import { delete_str } from "sonddr-shared";
import { authenticateIncomingMessage } from "./auth.js";
import { wsBasePath } from "./routes/routes.js";
import { ChatRoom, ChatRoomManager } from "./types/chat-room.js";
import { patchDocument, postDocument } from "./database.js";

export function addWebsockets(server: Server) {

	const messagesWss = new WebSocketServer({ noServer: true });

	server.on("upgrade", async (incomingMessage, duplex, buffer) => {
		duplex.on("error", (err) => console.error(err));

		try {

			await authenticateIncomingMessage(incomingMessage);

			if (incomingMessage.url!.startsWith(`${wsBasePath}/messages`)) {
				messagesWss.handleUpgrade(incomingMessage, duplex, buffer, (ws) => {
					messagesWss.emit('connection', ws, incomingMessage);
				});
			} else {
				throw new Error(`Unexpected websocket url: ${incomingMessage.url}`);
			}

		} catch (err) {
			duplex.destroy(err);
		}
	});

	const roomManager = new ChatRoomManager();

	messagesWss.on('connection', (ws, incomingMessage) => {

		const userId = incomingMessage["userId"];
		const discussionId = _getFromIncomingMessageQuery<string>("discussionId", incomingMessage);

		const room: ChatRoom = roomManager.getOrCreateRoom(discussionId, userId, ws);
		// n.b. no need to send previous messages, ChatRoom does it

		ws.on("message", async (data) => {

			const message = data.toString();

			if (message.startsWith(delete_str)) {

				const messageId = message.substring(delete_str.length);

				await patchDocument(
					`messages/${messageId}`,
					[
						{ field: "deleted", operator: "set", value: true },
						{ field: "content", operator: "set", value: "Deleted" },
					]
				);

			} else {

				const newMessagePayload = {
					discussionId: discussionId,
					authorId: userId,
					date: new Date(),
					content: message,
					deleted: false,
				};
				const newMessageId = await postDocument('messages', newMessagePayload);
				patchDocument(
					`discussions/${discussionId}`,
					[
						{ field: "lastMessageId", operator: "set", value: newMessageId },
						{ field: "readByIds", operator: "set", value: [userId] },
						{ field: "date", operator: "set", value: newMessagePayload.date },
					]
				);

			}
			// n.b. no need to dispatch anything, ChatRoom reacts to database changes

		});

		// heartbeat to keep the connection alive
		// otherwise nginx timeouts after 60s
		const pingId = setInterval(() => ws.ping(), 30000);

		ws.on("close", () => {
			clearInterval(pingId);  // stop ping loop
			room.leave(userId);
		});

	});

}

function _getFromIncomingMessageQuery<T>(key: string, incomingMessage: IncomingMessage): T {
	const url = new URL(incomingMessage.url, `http://${incomingMessage.headers.host}`);
	const value = url.searchParams.get(key);
	if (!value) { throw new Error(`${key} not found in request query parameters`); }
	return value as T;
}

