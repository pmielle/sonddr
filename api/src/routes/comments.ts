import { Router } from "express";
import { fetchUserId, keycloak } from "../auth.js";
import { deleteComment, getComment, getComments, postComment } from "../handlers/comments.js";

export function addCommentsRoutes(router: Router) {

	router.get('/comments/:id',
		keycloak.protect(),
		fetchUserId,
		async (req, res, next) => {
			try {
				await getComment(req, res, next);
			} catch (err) {
				next(err);
			}
		});

	router.post('/comments',
		keycloak.protect(),
		fetchUserId,
		async (req, res, next) => {
			try {
				await postComment(req, res, next);
			} catch (err) {
				next(err);
			}
		});

	router.delete('/comments/:id',
		keycloak.protect(),
		fetchUserId,
		async (req, res, next) => {
			try {
				await deleteComment(req, res, next);
			} catch (err) {
				next(err);
			}
		});

	router.get('/comments',
		keycloak.protect(),
		fetchUserId,
		async (req, res, next) => {
			try {
				await getComments(req, res, next);
			} catch (err) {
				next(err);
			}
		});

}
