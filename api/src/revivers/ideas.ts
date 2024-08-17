import { DbUser, DbIdea, Idea, Goal } from "sonddr-shared";
import { getDocuments } from "../database.js";
import { _getUnique, _getUniqueInArray } from "../utils.js";
import { reviveUsers } from "./users.js";

export async function reviveIdea(dbDoc: DbIdea, userId: string): Promise<Idea> {
    return (await reviveIdeas([dbDoc], userId))[0];
}

// userId is the id of the logged-in user
export async function reviveIdeas(dbDocs: DbIdea[], userId: string): Promise<Idea[]> {
    if (dbDocs.length == 0) { return []; }
    // get users and goals
    let usersToGet = _getUnique(dbDocs, "authorId");
    let goalsToGet = _getUniqueInArray(dbDocs, "goalIds");
    const [users, goals] = await Promise.all([
	    getDocuments<DbUser>("users", undefined, {field: "id", operator: "in", value: usersToGet})
	    	.then(dbUsers => reviveUsers(dbUsers, userId)),
	    getDocuments<Goal>("goals", undefined, {field: "id", operator: "in", value: goalsToGet}),
    ]);
    // convert dbDocs into docs
    const docs: Idea[] = dbDocs.map((dbDoc) => {
        const {authorId, goalIds, ...data} = dbDoc;
        data["author"] = users.find(u => u.id === authorId);
        data["goals"] = goals.filter(g => goalIds.includes(g.id));
        return data as any;
    });
    // return
    return docs;
}

