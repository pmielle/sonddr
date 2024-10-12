import { DbComment, Comment, DbUser, Vote, User } from "sonddr-shared";
import { _getUnique } from "../utils.js";
import { getDocuments } from "../database.js";
import { reviveUsers } from "./users.js";

export async function reviveComment(dbDoc: DbComment, userId: string|undefined = undefined): Promise<Comment> {
    return (await reviveComments([dbDoc], userId))[0];
}

// userId is the id of the logged-in user
export async function reviveComments(dbDocs: DbComment[], userId: string|undefined = undefined): Promise<Comment[]> {
    if (dbDocs.length == 0) { return []; }

	const authorsToGet = _getUnique(dbDocs, "authorId");
	const votesToGet = _getUnique(dbDocs, "id");

	let authors: User[];
	let votes: Vote[];

	if (userId) {
		[authors, votes] = await Promise.all([
			_usersPromise(authorsToGet),
			getDocuments<Vote>("votes", undefined, [
				{ field: "commentId", operator: "in", value: votesToGet },
				{ field: "authorId", operator: "eq", value: userId },
			]),
		]);
	} else {
		authors = await _usersPromise(authorsToGet);
	}

	const docs: Comment[] = dbDocs.map((dbDoc) => {
		const { authorId, ...data } = dbDoc;
		data["author"] = authors.find(u => u.id === authorId);
		if (userId) {
			const vote = votes.find(v => v.commentId === dbDoc.id);  // might be undefined
			data["userVote"] = vote ? vote.value : undefined;
		} else {
			data["userVote"] = undefined;
		}
		return data as any;
	});

	return docs;
}

// private
// --------------------------------------------
async function _usersPromise(authorsToGet: string[], userId: string|undefined = undefined): Promise<User[]> {
	return getDocuments<DbUser>("users", undefined, { field: "id", operator: "in", value: authorsToGet })
		.then(dbDocs => reviveUsers(dbDocs, userId));
}
