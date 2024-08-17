import { Router } from "express";
import { fetchUserId, keycloak } from "../auth.js";
import { deleteVote, putVote } from "../handlers/votes.js";

export function addVotesRoutes(router: Router) {

	router.delete(`/votes/:id`,
		keycloak.protect(),
		fetchUserId,
		async (req, res, next) => {
			try {
				await deleteVote(req, res, next);
			} catch (err) {
				next(err);
			}
		});

	router.put(`/votes/:id`,
		keycloak.protect(),
		fetchUserId,
		async (req, res, next) => {
			try {
				await putVote(req, res, next);
			} catch (err) {
				next(err);
			}
		});

}
