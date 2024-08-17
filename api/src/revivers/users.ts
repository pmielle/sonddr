import { User, DbUser, } from "sonddr-shared";

export function reviveUser(dbDoc: DbUser, userId: string): User {
	return reviveUsers([dbDoc], userId)[0];
}

// userId is the id of the logged-in user
export function reviveUsers(dbDocs: DbUser[], userId: string): User[] {
	if (dbDocs.length == 0) { return []; }
	// convert dbDocs into docs
	const docs: User[] = dbDocs.map((dbDoc) => {
		dbDoc["isUser"] = dbDoc.id === userId;
		return dbDoc as any;
	});
	// return
	return docs;
}

