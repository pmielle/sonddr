import { DbComment, DbIdea, localized_comment_deleted } from "sonddr-shared";
import { deleteDocuments, getDocuments, patchDocument, watchCollection } from "./../database.js";
import { deleteUpload } from "./../uploads.js";
import { generate_summary, llm_enabled, min_content_length } from "../llm.js";


export function watchIdeas() {
	watchCollection<DbIdea>("ideas").subscribe(async (change) => {
		const ideaId = change.docId;
		if (change.type === "insert") {
			const dbDoc = change.docAfter;
			if (llm_enabled && dbDoc.content.length >= min_content_length) {
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
		} else if (change.type === "update") {
            // soft remove the location of its comments
            let comments = await getDocuments<DbComment>(
                `comments`,
                undefined,
                [
                    { field: "ideaId", operator: "eq", value: ideaId },
                    { field: "location", operator: "nin", value: [null, [-1, -1]] },
                ]
            );
            await Promise.all(comments.map(c => patchDocument(
                `comments/${c.id}`,
                { field: "location", operator: "set", value: localized_comment_deleted }
            )));
        }
	});
}
