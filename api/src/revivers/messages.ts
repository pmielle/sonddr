import { DbMessage, DbUser, Message, } from "sonddr-shared";
import { getDocuments } from "../database.js";
import { _getUnique } from "../utils.js";
import { reviveUsers } from "./users.js";

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

