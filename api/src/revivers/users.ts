import { User, DbUser, } from "sonddr-shared";

export function reviveUser(dbDoc: DbUser, userId: string|undefined): User {
	return reviveUsers([dbDoc], userId)[0];
}

// userId is the id of the logged-in user if any
export function reviveUsers(dbDocs: DbUser[], userId: string|undefined = undefined): User[] {
	console.log(userId);
	if (dbDocs.length == 0) { return []; }
	// convert dbDocs into docs
	const docs: User[] = dbDocs.map((dbDoc) => {
		dbDoc["isUser"] = userId === undefined 
			? false 
			: dbDoc.id === userId;
		return dbDoc as any;
	});
	// return
	return docs;
}

