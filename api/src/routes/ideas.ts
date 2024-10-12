import { Router } from "express";
import { fetchUserId, keycloak } from "../auth.js";
import { deleteIdea, getIdea, getIdeas, patchIdea, postIdea } from "../handlers/ideas.js";
import { upload } from "../uploads.js";

export function addIdeasRoutes(router: Router) {

	router.get('/ideas',
		async (req, res, next) => {
			try {
				await getIdeas(req, res, next);
			} catch (err) {
				next(err);
			}
		});

	router.get('/ideas/:id',
		async (req, res, next) => {
			try {
				await getIdea(req, res, next);
			} catch (err) {
				next(err);
			}
		});

	router.delete('/ideas/:id',
		keycloak.protect(),
		fetchUserId,
		async (req, res, next) => {
			try {
				await deleteIdea(req, res, next);
			} catch (err) {
				next(err);
			}
		});

	router.patch(`/ideas/:id`,
		keycloak.protect(),
		fetchUserId,
		upload([{ name: "cover", maxCount: 1 }, { name: "images" }]),
		async (req, res, next) => {
			try {
				await patchIdea(req, res, next);
			} catch (err) {
				next(err);
			}
		});

	router.post('/ideas',
		keycloak.protect(),
		fetchUserId,
		upload([{ name: "cover", maxCount: 1 }, { name: "images" },]),
		async (req, res, next) => {
			try {
				await postIdea(req, res, next);
			} catch (err) {
				next(err);
			}
		});

}
