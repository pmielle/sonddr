import { Router } from "express";
import { maybeFetchUserId, keycloak } from "../auth.js";
import { deleteDraft, getDrafts, patchDraft, postDraft } from "../handlers/drafts.js";

export function addDraftsRoutes(router: Router) {

	router.get('/drafts',
		keycloak.protect(),
		maybeFetchUserId,
		async (req, res, next) => {
			try {
				await getDrafts(req, res, next);
			} catch (err) {
				next(err);
			}
		});

	router.delete('/drafts/:id',
		keycloak.protect(),
		maybeFetchUserId,
		async (req, res, next) => {
			try {
				await deleteDraft(req, res, next);
			} catch (err) {
				next(err);
			}
		});

	router.patch(`/drafts/:id`,
		keycloak.protect(),
		maybeFetchUserId,
		async (req, res, next) => {
			try {
				await patchDraft(req, res, next);
			} catch (err) {
				next(err);
			}
		});

	router.post('/drafts',
		keycloak.protect(),
		maybeFetchUserId,
		async (req, res, next) => {
			try {
				await postDraft(req, res, next);
			} catch (err) {
				next(err);
			}
		});

}
