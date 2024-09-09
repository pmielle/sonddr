import { Router } from "express";
import { addGoalsRoutes } from "./goals.js";
import { addIdeasRoutes } from "./ideas.js";
import { addUsersRoutes } from "./users.js";
import { addVotesRoutes } from "./votes.js";
import { addCheersRoutes } from "./cheers.js";
import { addCommentsRoutes } from "./comments.js";
import { addNotificationsRoutes } from "./notifications.js";
import { addDiscussionsRoutes } from "./discussions.js";
import { addVolunteersRoutes } from "./volunteers.js";
import { addDraftsRoutes } from "./drafts.js";

export const basePath = "/api";
export const wsBasePath = "/api/ws";

export function addRoutes(router: Router) {
	addGoalsRoutes(router);
	addIdeasRoutes(router);
	addUsersRoutes(router);
	addVotesRoutes(router);
	addCheersRoutes(router);
	addCommentsRoutes(router);
	addNotificationsRoutes(router);
	addDiscussionsRoutes(router);
	addVolunteersRoutes(router);
	addDraftsRoutes(router);
}
