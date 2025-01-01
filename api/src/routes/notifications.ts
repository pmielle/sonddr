import { Router } from "express";
import { deleteEndpoint, getNotifications, getVapidPublicKey, patchNotification, registerEndpoint } from "../handlers/notifications.js";
import { authenticateRequest, maybeFetchUserId, keycloak } from "../auth.js";

export function addNotificationsRoutes(router: Router) {

    router.get(
        '/vapid',
        keycloak.protect(),
        async (req, res, next) => {
            try {
                getVapidPublicKey(req, res, next);
            } catch(err) {
                next(err);
            }
        }
    );

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

    router.post(
        '/push',
        keycloak.protect(),
        maybeFetchUserId,
        async (req, res, next) => {
            try {
                await registerEndpoint(req, res, next);
            } catch (err) {
                next(err);
            }
        }
    );

    router.delete(
        '/push/:id',
        keycloak.protect(),
        maybeFetchUserId,
        async (req, res, next) => {
            try {
                await deleteEndpoint(req, res, next);
            } catch (err) {
                next(err);
            }
        }
    );

}
