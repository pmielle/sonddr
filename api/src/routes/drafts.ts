import { Router } from "express";
import { fetchUserId, keycloak } from "../auth.js";

export function addDraftsRoutes(router: Router) {

	router.get('/drafts',
		keycloak.protect(),
		fetchUserId,
		async (req, res, next) => {
			try {
				await getDrafts(req, res, next);
			} catch (err) {
				next(err);
			}
		});

	router.delete('/drafts/:id',
		keycloak.protect(),
		fetchUserId,
		async (req, res, next) => {
			try {
				await deleteDraft(req, res, next);
			} catch (err) {
				next(err);
			}
		});

	router.patch(`/drafts/:id`,
		keycloak.protect(),
		fetchUserId,
		async (req, res, next) => {
			try {
				await patchDraft(req, res, next);
			} catch (err) {
				next(err);
			}
		});

	router.post('/drafts',
		keycloak.protect(),
		fetchUserId,
		async (req, res, next) => {
			try {
				await postDraft(req, res, next);
			} catch (err) {
				next(err);
			}
		});

}
