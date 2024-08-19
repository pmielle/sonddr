import { DbUser, DbIdea, Idea, Goal, Cheer } from "sonddr-shared";
import { getDocuments } from "../database.js";
import { _getUnique, _getUniqueInArray } from "../utils.js";
import { reviveUsers } from "./users.js";
import { basePath } from "../routes/routes.js";
import { uploadPath } from "../uploads.js";

export async function reviveIdea(dbDoc: DbIdea, userId: string): Promise<Idea> {
    return (await reviveIdeas([dbDoc], userId))[0];
}

// userId is the id of the logged-in user
export async function reviveIdeas(dbDocs: DbIdea[], userId: string): Promise<Idea[]> {
	if (dbDocs.length == 0) { return []; }
	// get users and goals
	let usersToGet = _getUnique(dbDocs, "authorId");
	let goalsToGet = _getUniqueInArray(dbDocs, "goalIds");
	const cheersToGet = _getUnique(dbDocs, "id");
	const [users, goals, cheers] = await Promise.all([
		getDocuments<DbUser>("users", undefined, {field: "id", operator: "in", value: usersToGet})
		.then(dbUsers => reviveUsers(dbUsers, userId)),
			getDocuments<Goal>("goals", undefined, {field: "id", operator: "in", value: goalsToGet}),
		getDocuments<Cheer>("cheers", undefined, [
			{ field: "ideaId", operator: "in", value: cheersToGet },
			{ field: "authorId", operator: "eq", value: userId },
		]),
	]);
	// convert dbDocs into docs
	const docs: Idea[] = dbDocs.map((dbDoc) => {
		const {authorId, goalIds, ...data} = dbDoc;
		data["author"] = users.find(u => u.id === authorId);
		data["goals"] = goals.filter(g => goalIds.includes(g.id));
		data["userHasCheered"] = cheers.find(c => c.ideaId === dbDoc.id) ? true : false;
		data["content"] = _fixImageSources(data["content"]);
		return data as any;
	});
	// return
	return docs;
}

// private
// --------------------------------------------
function _fixImageSources(content: string) {
	return content.replaceAll(
		/<img src="(.+?)">/g,
		`<img src="${basePath}/${uploadPath}/$1">`
	);
}

