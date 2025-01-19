import { Subject } from "rxjs";
import { Change, DbDiscussion, Notification, DbMessage } from "sonddr-shared";
import { watchCollection } from "../database.js";
import { watchComments } from "./comments.js";
import { watchIdeas } from "./ideas.js";
import { watchVotes } from "./votes.js";
import { watchCheers } from "./cheers.js";
import { watchVolunteers } from "./volunteers.js";
import { watchMessages } from "./messages.js";
import { watchNotifications } from "./notifications.js";


// init private triggers
// ----------------------------------------------
export function startAllTriggers() {
	watchComments();
	watchIdeas();
	watchVotes();
	watchCheers();
	watchVolunteers();
    watchMessages();
    watchNotifications();
}


// change streams
// ----------------------------------------------
export const notificationsChanges$: Subject<Change<Notification>> = new Subject();
watchCollection<Notification>("notifications").subscribe(notificationsChanges$);

export const discussionsChanges$: Subject<Change<DbDiscussion>> = new Subject();
watchCollection<DbDiscussion>("discussions").subscribe(discussionsChanges$);

export const messagesChanges$: Subject<Change<DbMessage>> = new Subject();
watchCollection<DbMessage>("messages").subscribe(messagesChanges$);
