import { Router } from "express";
import { getNotifications, patchNotification } from "../handlers/notifications.js";
import { authenticateRequest, maybeFetchUserId, keycloak } from "../auth.js";

export function addNotificationsRoutes(router: Router) {

	router.patch('/notifications/:id',
		keycloak.protect(),
		maybeFetchUserId,
		async (req, res, next) => {
			try {
				await patchNotification(req, res, next);
			} catch (err) {
				next(err);
			}
		});

	router.get('/notifications',
		authenticateRequest,
		async (req, res, next) => {
			try {
				await getNotifications(req, res, next);
			} catch (err) {
				next(err);
			}
		});

}
