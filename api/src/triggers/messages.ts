import { DbDiscussion, DbMessage, DbUser, Push } from "sonddr-shared";
import { deleteDocument, getDocument, getDocuments, watchCollection } from "./../database.js";
import { deleteUpload } from "./../uploads.js";
import { deleted } from "../types/chat-room.js";
import webpush, { WebPushError } from "web-push";

export function watchMessages() {
	watchCollection<DbMessage>("messages").subscribe(async (change) => {
        if (change.type === "update") {
            if (change.docAfter.content === deleted) {
                onMessageDelete(change.docBefore);  // same cleanup as actual deletion for now
            }
        } else if (change.type === "delete") {
            onMessageDelete(change.docBefore);
		} else if (change.type === "insert") {
            notifyRecipients(change.docAfter);
        }
	});
}

async function notifyRecipients(dbMessage: DbMessage) {
    let [discussion, author] = await Promise.all([
        await getDocument<DbDiscussion>(`discussions/${dbMessage.discussionId}`),
        await getDocument<DbUser>(`users/${dbMessage.authorId}`),
    ]);
    let toUserIds = discussion.userIds.filter(u => u !== author.id);
    let payload = {
        notification: {
            title: `New message from ${author.name}`,
            body: dbMessage.content,
            data: {
                onActionClick: {
                    default: { operation: "navigateLastFocusedOrOpen", "url": `messages/discussion/${discussion.id}` }
                },
            },
        }
    };
    const endpoints = await getDocuments<Push>("push", undefined, {
        field: "userId",
        operator: "in",
        value: toUserIds,
    });
    await Promise.all(endpoints.map(endpoint => {
        webpush.sendNotification(endpoint.subscription, JSON.stringify(payload))
        .catch(async (err: WebPushError) => _onWebpushError(err, endpoint.id));
    }));
}

function onMessageDelete(message: DbMessage) {
    if (message.img) {
        deleteUpload(message.img);
    }
}

async function _onWebpushError(err: WebPushError, pushId: string) {
    if (err.statusCode === 410) { // "Gone" e.g. the user revoked permission
        await deleteDocument(`push/${pushId}`);
    }
}

