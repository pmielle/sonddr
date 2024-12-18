import { DbMessage } from "sonddr-shared";
import { watchCollection } from "./../database.js";
import { deleteUpload } from "./../uploads.js";

export function watchMessages() {
	watchCollection<DbMessage>("messages").subscribe(async (change) => {
		if (change.type === "delete") {
			// delete its images
			const message = change.docBefore;
			if (message.img) { deleteUpload(message.img); }
		}
	});
}
