import { Router } from "express";
import { getDiscussion, getDiscussions, patchDiscussion, postDiscussion } from "../handlers/discussions.js";
import { authenticateRequest, fetchUserId, keycloak } from "../auth.js";

export function addDiscussionsRoutes(router: Router) {

	router.post('/discussions',
		keycloak.protect(),
		fetchUserId,
		async (req, res, next) => {
			try {
				await postDiscussion(req, res, next);
			} catch (err) {
				next(err);
			};
		});

	router.patch('/discussions/:id',
		keycloak.protect(),
		fetchUserId,
		async (req, res, next) => {
			try {
				await patchDiscussion(req, res, next);
			} catch (err) {
				next(err);
			}
		});

	router.get('/discussions/:id',
		keycloak.protect(),
		fetchUserId,
		async (req, res, next) => {
			try {
				await getDiscussion(req, res, next);
			} catch (err) {
				next(err);
			}
		});

	router.get('/discussions',
		authenticateRequest,
		async (req, res, next) => {
			try {
				await getDiscussions(req, res, next);
			} catch (err) {
				next(err);
			}
		});

}
