import { DbVolunteer, DbIdea, DbUser, } from "sonddr-shared";
import { getDocument, postDocument, watchCollection } from "./../database.js";
import { NotFoundError } from "../types/types.js";

export function watchVolunteers() {
	// - upon deletion: notify the assigned user if any
	// - upon un-assignation: notify the assigned user
	// - upon candidate insertion: notifiy idea author
	// - upon candidate acceptation: notify candidate
	watchCollection<DbVolunteer>("volunteers").subscribe(async (change) => {
		if (change.type === "delete") {
			const userId = change.docBefore.userId;
			if (userId) {
				let dbIdea: DbIdea;
				try {
					dbIdea = await getDocument<DbIdea>(`ideas/${change.docBefore.ideaId}`);
				} catch (err) {
					// if an idea gets deleted, then its volunteers are deleted too
					// in that case, we don't wanna notify anyone
					if (err instanceof NotFoundError) { return; }
				}
				const notificationPayload = {
					toIds: [userId],
					date: new Date(),
					readByIds: [],
					content: `Your volunteer position for ${dbIdea.title} has been deleted.`,
                    href: `/ideas/idea/${dbIdea.id}`,
				};
				postDocument(`notifications`, notificationPayload);
			}
		} else if (change.type === "update") {

			const dbIdea = await getDocument<DbIdea>(`ideas/${change.docBefore.ideaId}`);

			// check user changes
			const userBefore = change.docBefore.userId;
			const userAfter = change.docAfter.userId;
			// - user has been un-assigned
			if (userBefore && !userAfter) {
				const notificationPayload = {
					toIds: [userBefore],
					date: new Date(),
					readByIds: [],
					content: `You were removed from your volunteer position for ${dbIdea.title}.`,
                    href: `/ideas/idea/${dbIdea.id}`,
				};
				postDocument(`notifications`, notificationPayload);
			// - candidate has been accepted
			} else if (!userBefore && userAfter) {
				const notificationPayload = {
					toIds: [userAfter],
					date: new Date(),
					readByIds: [],
					content: `Your volunteer application for ${dbIdea.title} has been accepted.`,
                    href: `/ideas/idea/${dbIdea.id}`,
				};
				postDocument(`notifications`, notificationPayload);
			}

			// check for new candidate
			const candidatesBefore = change.docBefore.candidateIds;
			const candidateAfter = change.docAfter.candidateIds;
			if (candidateAfter.length > candidatesBefore.length) {
				const newCandidates = candidateAfter.filter(id => candidatesBefore.indexOf(id) == -1);
				if (newCandidates.length > 1) {
					throw new Error(`More than 1 candidate has been added to ${change.docId}: this should not happen`);
				}
				const newCandidate = await getDocument<DbUser>(`users/${newCandidates[0]}`);
				const notificationPayload = {
					toIds: [dbIdea.authorId],
					date: new Date(),
					readByIds: [],
					content: `${newCandidate.name} has applied for a volunteer position for ${dbIdea.title}.`,
                    href: `/ideas/idea/${dbIdea.id}`,
                    picture: newCandidate.profilePicture,
				};
				postDocument(`notifications`, notificationPayload);
			}
		}
	});
}

