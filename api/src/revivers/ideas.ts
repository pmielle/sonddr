import { DbUser, DbIdea, Idea, Goal, Cheer, User } from "sonddr-shared";
import { getDocuments } from "../database.js";
import { _getUnique, _getUniqueInArray } from "../utils.js";
import { reviveUsers } from "./users.js";
import { basePath } from "../routes/routes.js";
import { uploadPath } from "../uploads.js";

export async function reviveIdea(dbDoc: DbIdea, userId: string|undefined = undefined): Promise<Idea> {
    return (await reviveIdeas([dbDoc], userId))[0];
}

// userId is the id of the logged-in user if any
export async function reviveIdeas(dbDocs: DbIdea[], userId: string|undefined = undefined): Promise<Idea[]> {
	if (dbDocs.length == 0) { return []; }
	// get users and goals
	let usersToGet = _getUnique(dbDocs, "authorId");
	let goalsToGet = _getUniqueInArray(dbDocs, "goalIds");
	const cheersToGet = _getUnique(dbDocs, "id");

	let users: User[];
	let goals: Goal[];
	let cheers: Cheer[]|undefined = undefined;

	if (userId) {
		[users, goals, cheers] = await Promise.all([
			_usersPromise(usersToGet, userId),
			_goalsPromise(goalsToGet),
			getDocuments<Cheer>("cheers", undefined, [
				{ field: "ideaId", operator: "in", value: cheersToGet },
				{ field: "authorId", operator: "eq", value: userId },
			]),
		]);
	} else {
		[users, goals] = await Promise.all([
			_usersPromise(usersToGet),
			_goalsPromise(goalsToGet),
		]);
	}

	if (userId) {}
	// convert dbDocs into docs
	const docs: Idea[] = dbDocs.map((dbDoc) => {
		const {authorId, goalIds, ...data} = dbDoc;
		data["author"] = users.find(u => u.id === authorId);
		data["goals"] = goals.filter(g => goalIds.includes(g.id));
		data["userHasCheered"] = cheers 
			? cheers.find(c => c.ideaId === dbDoc.id) ? true : false
			: false;
		data["content"] = _fixImageSources(data["content"]);
		return data as any;
	});
	// return
	return docs;
}

// private
// --------------------------------------------
async function _usersPromise(usersToGet: string[], userId: string|undefined = undefined): Promise<User[]> {
	return getDocuments<DbUser>("users", undefined, {field: "id", operator: "in", value: usersToGet})
		.then(dbUsers => reviveUsers(dbUsers, userId));
}

async function _goalsPromise(goalsToGet: string[]): Promise<Goal[]> {
	return getDocuments<Goal>("goals", undefined, {field: "id", operator: "in", value: goalsToGet});
}

function _fixImageSources(content: string) {
	return content.replaceAll(
		/<img src="(.+?)">/g,
		`<img src="${basePath}/${uploadPath}/$1">`
	);
}

