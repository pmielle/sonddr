import { DbMessage, DbReaction, DbUser, Message, Reaction, User, } from "sonddr-shared";
import { getDocuments } from "../database.js";
import { _getUnique, _getUniqueInArray } from "../utils.js";
import { reviveUsers } from "./users.js";

export async function reviveMessage(dbDoc: DbMessage, userId: string): Promise<Message> {
    return (await reviveMessages([dbDoc], userId))[0];
}

// userId is the id of the logged-in user
export async function reviveMessages(dbDocs: DbMessage[], userId: string): Promise<Message[]> {
    if (dbDocs.length == 0) { return []; }
    // get users
    let usersToGet = _getUnique(dbDocs, "authorId")
        .concat(_getUniqueInArray(dbDocs.flatMap(doc => doc.reactions), "fromUserIds"));
    const users = await getDocuments<DbUser>(
        "users", undefined, {field: "id", operator: "in", value: usersToGet}
    ).then(dbDocs => reviveUsers(dbDocs, userId));
    // convert dbDocs into docs
    const docs: Message[] = dbDocs.map((dbDoc) => {
        const {authorId, reactions, ...data} = dbDoc;
        if (reactions) {
            data["reactions"] = _reviveReactions(reactions, users);
            data["userReaction"] = _findUserReaction(reactions, userId);
        }
        data["author"] = users.find(u => u.id === authorId);
        return data as any;
    });
    // return
    return docs;
}

function _reviveReactions(dbReactions: DbReaction[], users: User[]): Reaction[] {
    return dbReactions.map(dbReaction => {
        let reaction: Reaction = {
            emoji: dbReaction.emoji,
            fromUsers: users.filter(u => dbReaction.fromUserIds.includes(u.id)),
        };
        return reaction;
    });
}

function _findUserReaction(reactions: DbReaction[], userId: string): string|undefined {
    let userReaction = reactions.find(r => r.fromUserIds.includes(userId));
    return userReaction ? userReaction.emoji : undefined;
}
