import { DbUser, DbVolunteer, Volunteer, DbIdea, } from "sonddr-shared";
import { getDocuments } from "../database.js";
import { _getUnique, _getUniqueInArray } from "../utils.js";
import { reviveIdeas } from "./ideas.js";
import { reviveUsers } from "./users.js";

export async function reviveVolunteer(dbDoc: DbVolunteer, userId: string|undefined = undefined): Promise<Volunteer> {
	return (await reviveVolunteers([dbDoc], userId))[0];
}

// userId is the id of the logged-in user
export async function reviveVolunteers(dbDocs: DbVolunteer[], userId: string|undefined = undefined): Promise<Volunteer[]> {
	if (dbDocs.length == 0) { return []; }
	// get users
	let ideasToGet = _getUnique(dbDocs, "ideaId");
	let usersToGet = _getUnique(dbDocs, "userId").concat(_getUniqueInArray(dbDocs, "candidateIds"));
	const [users, ideas] = await Promise.all([
		getDocuments<DbUser>("users", undefined, { field: "id", operator: "in", value: usersToGet })
			.then(dbUsers => reviveUsers(dbUsers, userId)),
		getDocuments<DbIdea>("ideas", undefined, { field: "id", operator: "in", value: ideasToGet })
			.then(async dbIdeas => await reviveIdeas(dbIdeas, userId)),
	]);
	// convert dbDocs into docs
	const docs: Volunteer[] = dbDocs.map((dbDoc) => {
		const { userId, ideaId, candidateIds, ...data } = dbDoc;
		data["user"] = users.find(u => u.id === userId);
		data["idea"] = ideas.find(u => u.id === ideaId);
		data["candidates"] = users.filter(u => candidateIds.includes(u.id));
		return data as any;
	});
	// return
	return docs;
}

