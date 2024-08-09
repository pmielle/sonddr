import { DbDiscussion, DbMessage, User, DbUser, Discussion, Doc, Message, Change, DbVolunteer, Volunteer, DbIdea, Idea, Goal } from "sonddr-shared";
import { getDocuments } from "./database.js";

// volunteers
// --------------------------------------------
export async function reviveVolunteer(dbDoc: DbVolunteer, userId: string): Promise<Volunteer> {
    return (await reviveVolunteers([dbDoc], userId))[0];
}

// userId is the id of the logged-in user
export async function reviveVolunteers(dbDocs: DbVolunteer[], userId: string): Promise<Volunteer[]> {
    if (dbDocs.length == 0) { return []; }
    // get users
    let ideasToGet = _getUnique(dbDocs, "ideaId");
    let usersToGet = _getUnique(dbDocs, "userId").concat(_getUniqueInArray(dbDocs, "candidateIds"));
    const [users, ideas] = await Promise.all([
	    getDocuments<DbUser>("users", undefined, { field: "id", operator: "in", value: usersToGet })
	    	.then(dbUsers => reviveUsers(dbUsers, userId)),
	    getDocuments<DbIdea>("ideas", undefined, {field: "id", operator: "in", value: ideasToGet})
	    	.then(async dbIdeas => await reviveIdeas(dbIdeas, userId)),
    ]);
    // convert dbDocs into docs
    const docs: Volunteer[] = dbDocs.map((dbDoc) => {
        const {userId, ideaId, candidateIds, ...data} = dbDoc;
        data["user"] = users.find(u => u.id === userId);
        data["idea"] = ideas.find(u => u.id === ideaId);
	data["candidateIds"] = users.find(u => candidateIds.includes(u.id));
        return data as any;
    });
    // return
    return docs;
}


// ideas
// --------------------------------------------
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


// users
// --------------------------------------------
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


// messages
// --------------------------------------------
export async function reviveMessage(dbDoc: DbMessage, userId: string): Promise<Message> {
    return (await reviveMessages([dbDoc], userId))[0];
}

// userId is the id of the logged-in user
export async function reviveMessages(dbDocs: DbMessage[], userId: string): Promise<Message[]> {
    if (dbDocs.length == 0) { return []; }
    // get users
    let usersToGet = _getUnique(dbDocs, "authorId");
    const users = await getDocuments<DbUser>(
        "users", 
        undefined, 
        {field: "id", operator: "in", value: usersToGet}
    ).then(dbDocs => reviveUsers(dbDocs, userId));
    // convert dbDocs into docs
    const docs: Message[] = dbDocs.map((dbDoc) => {
        const {authorId, ...data} = dbDoc;
        data["author"] = users.find(u => u.id === authorId);
        return data as any;
    });
    // return
    return docs;
}


// discussions
// --------------------------------------------
export async function reviveDiscussion(dbDoc: DbDiscussion, userId: string): Promise<Discussion> {
    return (await reviveDiscussions([dbDoc], userId))[0];
}

export async function reviveDiscussions(dbDocs: DbDiscussion[], userId: string): Promise<Discussion[]> {

    if (dbDocs.length == 0) { return []; }
    // get lastMessages
    const messagesToGet = _getUnique(dbDocs, "lastMessageId");
    let messageDocs: DbMessage[] = [];
    if (messagesToGet.length) {
        messageDocs = await getDocuments<DbMessage>(
            "messages",
            undefined,
            {field: "id", operator: "in", value: messagesToGet}
        );
    }
    // get users (userIds + lastMessages authorIds)
    let usersToGet = _getUniqueInArray(dbDocs, "userIds");
    usersToGet.concat(_getUnique(messageDocs, "authorId"));
    const users = await getDocuments<DbUser>(
        "users", 
        undefined, 
        {field: "id", operator: "in", value: usersToGet}
    ).then(dbDocs => reviveUsers(dbDocs, userId));
    // convert dbDocs into docs
    const messages: Message[] = messageDocs.map((dbDoc) => {
        const {authorId, ...data} = dbDoc;
        data["author"] = users.find(u => u.id === authorId);
        return data as any;
    });
    const docs: Discussion[] = dbDocs.map((dbDoc) => {
        const {userIds, lastMessageId, ...data} = dbDoc;
        data["users"] = users.filter(u => userIds.includes(u.id));
        data["lastMessage"] = messages.find(m => m.id === lastMessageId);
        return data as any;
    });
    // return
    return docs;
}

export async function reviveChange<DbT, T>(
	change: Change<DbT>, 
	reviver: (x: DbT, ...extraParams: any) => Promise<T>, 
	...reviverExtraParams: any
): Promise<Change<T>> {
	const toRevive = [];
	let beforeFlag: boolean;
	if (change.docBefore) { toRevive.push(change.docBefore); beforeFlag = true; } else { beforeFlag = false; }
	if (change.docAfter) { toRevive.push(change.docAfter) }
	const revived = await Promise.all(toRevive.map(x => reviver(x, ...reviverExtraParams)));
	let docBefore: T;
	let docAfter: T;
	if (revived.length === 1) {
		if (beforeFlag) {
			docBefore = revived[0]
		} else {
			docAfter = revived[0];
		}
	} else if (revived.length === 2) {
		[docBefore, docAfter] = revived;
	} else { 
		throw new Error("Failed to revive change");
	}
	return { ...change, docBefore: docBefore, docAfter: docAfter };
}


// private
// ----------------------------------------------
function _getUnique<T extends Doc, U extends keyof T>(collection: T[], key: U): T[U][] {
    return Array.from(collection.reduce((result, current) => {
        if (key in current) {  // key might be optional
            result.add(current[key] as T[U]);
        }
        return result;
    }, new Set<T[U]>).values());
}

function _getUniqueInArray<T, U extends keyof T>(collection: T[], key: U): T[U] {
    return Array.from(collection.reduce((result, current) => {
        (current[key] as any).forEach((item: any) => {
            result.add(item);
        });
        return result;
    }, new Set<any>).values()) as T[U];
}
