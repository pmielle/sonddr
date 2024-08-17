import { Router } from "express";
import { deleteCheer, getCheer, putCheer } from "../handlers/cheers.js";
import { fetchUserId, keycloak } from "../auth.js";

export function addCheersRoutes(router: Router) {

	router.delete(`/cheers/:id`,
		keycloak.protect(),
		fetchUserId,
		async (req, res, next) => {
			try {
				await deleteCheer(req, res, next);
			} catch (err) {
				next(err);
			}
		});

	router.get('/cheers/:id',
		keycloak.protect(),
		async (req, res, next) => {
			try {
				await getCheer(req, res, next);
			} catch (err) {
				next(err);
			}
		});

	router.put('/cheers/:id',
		keycloak.protect(),
		fetchUserId,
		async (req, res, next) => {
			try {
				await putCheer(req, res, next);
			} catch (err) {
				next(err);
			}
		});

}
