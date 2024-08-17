import { DbDiscussion, DbMessage, DbUser, Discussion, Message, } from "sonddr-shared";
import { getDocuments } from "../database.js";
import { _getUnique, _getUniqueInArray } from "../utils.js";
import { reviveUsers } from "./users.js";

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

