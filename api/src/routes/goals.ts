import { Router } from "express";
import { keycloak } from "../auth.js";
import { getGoal, getGoals } from "../handlers/goals.js";

export function addGoalsRoutes(router: Router) {

	router.get('/goals',
		keycloak.protect(),
		async (req, res, next) => {
			try {
				await getGoals(req, res, next);
			} catch (err) {
				next(err);
			}
		});

	router.get('/goals/:id',
		keycloak.protect(),
		async (req, res, next) => {
			try {
				await getGoal(req, res, next);
			} catch (err) {
				next(err);
			}
		});

}
