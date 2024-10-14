import { Router } from "express";
import { keycloak, maybeFetchUserId } from "../auth.js";
import { getGoal, getGoals } from "../handlers/goals.js";

export function addGoalsRoutes(router: Router) {

	router.get('/goals',
		maybeFetchUserId,
		async (req, res, next) => {
			try {
				await getGoals(req, res, next);
			} catch (err) {
				next(err);
			}
		});

	router.get('/goals/:id',
		maybeFetchUserId,
		async (req, res, next) => {
			try {
				await getGoal(req, res, next);
			} catch (err) {
				next(err);
			}
		});

}
