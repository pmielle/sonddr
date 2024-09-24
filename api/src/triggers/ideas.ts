import { DbIdea } from "sonddr-shared";
import { deleteDocuments, patchDocument, watchCollection } from "./../database.js";
import { deleteUpload } from "./../uploads.js";
import { generate_summary, min_content_length } from "../llm.js";


export function watchIdeas() {
	watchCollection<DbIdea>("ideas").subscribe(async (change) => {
		const ideaId = change.docId;
		if (change.type === "insert") {
			const dbDoc = change.docAfter;
			if (dbDoc.content.length >= min_content_length) {
				generate_summary(dbDoc).then((summary) => {
					patchDocument(`ideas/${ideaId}`, {
						field: "summary",
						operator: "set",
						value: summary,
					});
				});
			}
		} else if (change.type === "delete") {
			// delete its images
			const idea = change.docBefore;
			if (idea.cover) { deleteUpload(idea.cover); }
			for (const path of idea.content.matchAll(/<img src="(?<path>\w+)">/g)) {
				deleteUpload(path.groups["path"]);
			}
			// delete its comments
			deleteDocuments(`comments`, { field: "ideaId", operator: "eq", value: ideaId });
			// delete its volunteers
			deleteDocuments(`volunteers`, { field: "ideaId", operator: "eq", value: ideaId });
		}
	});
}
