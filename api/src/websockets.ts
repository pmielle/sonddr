import { IncomingMessage } from "http";
import { Server } from "node:http";
import { WebSocketServer } from "ws";
import { DbMessage, DbReaction, delete_react_str, delete_str, react_str, sep_str } from "sonddr-shared";
import { authenticateIncomingMessage } from "./auth.js";
import { wsBasePath } from "./routes/routes.js";
import { ChatRoom, ChatRoomManager } from "./types/chat-room.js";
import { getDocument, patchDocument, postDocument } from "./database.js";

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

                const messageId = message.split(sep_str)[1];
				await patchDocument(
					`messages/${messageId}`,
					[
						{ field: "deleted", operator: "set", value: true },
						{ field: "content", operator: "set", value: "Deleted" },
					]
				);

            } else if (message.startsWith(react_str)) {

                const [messageId, emoji] = message.split(sep_str).slice(1,3);
                let dbMessage = await getDocument<DbMessage>(`messages/${messageId}`);
                let reactions = _addToReactions(dbMessage.reactions, emoji, userId);
				await patchDocument(
					`messages/${messageId}`,
					[ { field: "reactions", operator: "set", value: reactions } ]
				);

			} else if (message.startsWith(delete_react_str)) {

                const messageId = message.split(sep_str)[1];
                let dbMessage = await getDocument<DbMessage>(`messages/${messageId}`);
                let reactions = _removeReaction(dbMessage.reactions, userId);
				await patchDocument(
					`messages/${messageId}`,
					[ { field: "reactions", operator: "set", value: reactions } ]
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

function _addToReactions(reactions: DbReaction[]|undefined, emoji: string, userId: string): DbReaction[] {
    // first time someone ever react to this message
    if (!reactions) {
        return [{emoji: emoji, fromUserIds: [userId]}];
    }
    // if user has already reacted, remove their previous reaction
    reactions = _removeReaction(reactions, userId) || [];
    // add new reaction to preexisting list
    let reaction = reactions.find(r => r.emoji === emoji);
    if (reaction) {
        // someone has already reacted with this emoji
        if (reaction.fromUserIds.includes(userId)) {
            throw new Error(`${userId} has already reacted with ${emoji}`);
        }
        reaction.fromUserIds.push(userId);
    } else {
        // first time someone reacts with this emoji
        reactions.push({emoji: emoji, fromUserIds: [userId]});
    }
    return reactions;
}

function _removeReaction(reactions: DbReaction[], userId: string): DbReaction[]|undefined {
    let previousReaction = reactions.find(r => r.fromUserIds.includes(userId));
    if (previousReaction) {
        // remove the user from the list
        previousReaction.fromUserIds = previousReaction.fromUserIds.filter(id => id !== userId);
        // remove this reaction entirely if it was the only user
        if (previousReaction.fromUserIds.length === 0) {
            reactions = reactions.filter(r => r !== previousReaction);
        }
        // return undefined if empty
        if (reactions.length === 0) { return undefined; }
    }
    return reactions;
}

function _getFromIncomingMessageQuery<T>(key: string, incomingMessage: IncomingMessage): T {
	const url = new URL(incomingMessage.url, `http://${incomingMessage.headers.host}`);
	const value = url.searchParams.get(key);
	if (!value) { throw new Error(`${key} not found in request query parameters`); }
	return value as T;
}

