import { WebSocket } from "ws";
import { Subscription, filter as rxFilter } from "rxjs";
import { Change, DbMessage, DbReaction, delete_react_str, delete_str, Message, placeholder_id, react_str, sep_str } from "sonddr-shared";
import { getDocument, getDocuments, patchDocument, postDocument } from "../database.js";
import { messagesChanges$ } from "../triggers/triggers.js";
import { reviveMessage, reviveMessages } from "../revivers/messages.js";
import { reviveChange } from "../revivers/changes.js";


export class ChatRoomManager {

	rooms = new Map<string, ChatRoom>();  // keys are discussion IDs

	constructor() {}

	joinOrCreateRoom(discussionId: string, userId: string, socket: WebSocket): ChatRoom {
		let room: ChatRoom;
		if (this.rooms.has(discussionId)) {
			room = this.rooms.get(discussionId);
			room.connect(userId, socket);
		} else {
			room = new ChatRoom(discussionId, userId, socket);  // no need to join the room after, it is done in init()
			this.rooms.set(discussionId, room);
		}
		return room;
	}

    leaveRoom(discussionId: string, userId: string) {
        let room = this.rooms.get(discussionId);
        room.disconnect(userId);
        if (room.isEmpty()) {
            room.disable();
            this.rooms.delete(discussionId);
        }
    }
}

export class ChatRoom {

	discussionId: string;
	databaseSub?: Subscription;
	clients = new Map<string, WebSocket>();  // keys are user IDs

	constructor(discussionId: string, firstUserId: string, firstUserSocket: WebSocket) {
		this.discussionId = discussionId;
		this._init(firstUserId, firstUserSocket);
	}

	async connect(userId: string, socket: WebSocket) {
		const oldMessages = await this._getOldMessages(userId);
		this._send(oldMessages, socket);
		this.clients.set(userId, socket);
        socket.on("message", async (data) => this._recieve(data.toString(), userId));
	}

	disconnect(userId: string) {
		this.clients.delete(userId);
	}

	isEmpty(): boolean {
		return this.clients.size === 0;
	}

	disable() {
		this.databaseSub?.unsubscribe();
	}

	// private
	// ------------------------------------------
	async _init(firstUserId: string, firstUserSocket: WebSocket) {
		await this.connect(firstUserId, firstUserSocket);
		this._listenToDatabase();
	}

	_listenToDatabase() {
		this.databaseSub = messagesChanges$.pipe(
			rxFilter(change => this._getDiscussionIdOfDbChange(change) === this.discussionId),
		).subscribe(async dbChange => {
			for (const [userId, ws] of this.clients) {
                let change = await reviveChange(dbChange, reviveMessage, userId);
				const isUser = this._getAuthorIdOfChange(change) === userId
				// a placeholder is inserted client side when a message is send
				// change the type to "update" for this specific client to replace the placeholder
				const changeToSend = (isUser && change.type === "insert")
					? { ...change, type: "update", docId: placeholder_id } as Change<Message>
					: change;
				// actually send
				this._send(changeToSend, ws);
			}
		});
	}

    async _recieve(message: string, userId: string) {
        if (message.startsWith(delete_str)) {
            const messageId = message.split(sep_str)[1];
            this._delete(messageId);
        } else if (message.startsWith(react_str)) {
            const [messageId, emoji] = message.split(sep_str).slice(1,3);
            this._react(messageId, emoji, userId);
        } else if (message.startsWith(delete_react_str)) {
            const messageId = message.split(sep_str)[1];
            this._deleteReaction(messageId, userId);
        } else {
            this._post(message, userId);
        }
    }

    async _post(message: string, userId: string) {
        const newMessagePayload = {
            discussionId: this.discussionId,
            authorId: userId,
            date: new Date(),
            content: message,
            deleted: false,
        };
        const newMessageId = await postDocument('messages', newMessagePayload);
        patchDocument(
            `discussions/${this.discussionId}`,
            [
                { field: "lastMessageId", operator: "set", value: newMessageId },
                { field: "readByIds", operator: "set", value: [userId] },
                { field: "date", operator: "set", value: newMessagePayload.date },
            ]
        );
    }

    async _delete(messageId: string) { // TODO: only allow author
        await patchDocument(
            `messages/${messageId}`,
            [
                { field: "deleted", operator: "set", value: true },
                { field: "content", operator: "set", value: "Deleted" },
            ]
        );
    }

    async _react(messageId: string, emoji: string, userId: string) {
        let dbMessage = await getDocument<DbMessage>(`messages/${messageId}`);
        let reactions = this._addToReactions(dbMessage.reactions, emoji, userId);
        await patchDocument(
            `messages/${messageId}`,
            [ { field: "reactions", operator: "set", value: reactions } ]
        );
    }

    async _deleteReaction(messageId: string, userId: string) { // TODO: only allow author
        let dbMessage = await getDocument<DbMessage>(`messages/${messageId}`);
        let reactions = this._removeReaction(dbMessage.reactions, userId);
        await patchDocument(
            `messages/${messageId}`,
            [ { field: "reactions", operator: "set", value: reactions } ]
        );
    }

	_send(payload: Message[]|Change<Message>, socket: WebSocket) {
		socket.send(JSON.stringify(payload));
	}

	async _getOldMessages(userId: string): Promise<Message[]> {
		const docs = await getDocuments<DbMessage>(
			"messages",
			{field: "date", desc: true},
			{field: "discussionId", operator: "eq", value: this.discussionId},
		).then(dbDocs => reviveMessages(dbDocs, userId));
		return docs;
	}

	_getDiscussionIdOfDbChange(change: Change<DbMessage>): string {
		const discussionId = change.docBefore?.discussionId || change.docAfter?.discussionId;
		if (! discussionId) { throw new Error("Failed to find discussionId of change"); }
		return discussionId;
	}

	_getAuthorIdOfChange(change: Change<Message>): string {
		const authorId = change.docBefore?.author.id || change.docAfter?.author.id;
		if (! authorId) { throw new Error("Failed to find authorId of change"); }
		return authorId;
	}

    _addToReactions(reactions: DbReaction[]|undefined, emoji: string, userId: string): DbReaction[] {
        // first time someone ever react to this message
        if (!reactions) {
            return [{emoji: emoji, fromUserIds: [userId]}];
        }
        // if user has already reacted, remove their previous reaction
        reactions = this._removeReaction(reactions, userId) || [];
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

    _removeReaction(reactions: DbReaction[], userId: string): DbReaction[]|undefined {
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
}
