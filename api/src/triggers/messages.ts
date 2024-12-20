import { DbMessage } from "sonddr-shared";
import { watchCollection } from "./../database.js";
import { deleteUpload } from "./../uploads.js";
import { deleted } from "../types/chat-room.js";

export function watchMessages() {
	watchCollection<DbMessage>("messages").subscribe(async (change) => {
        if (change.type === "update") {
            if (change.docAfter.content === deleted) {
                onMessageDelete(change.docBefore);  // same cleanup as actual deletion for now
            }
        } else if (change.type === "delete") {
            onMessageDelete(change.docBefore);
		}
	});
}

function onMessageDelete(message: DbMessage) {
    if (message.img) {
        deleteUpload(message.img);
    }
}
