import { Router } from "express";
import { checkEndpoint, getNotifications, getVapidPublicKey, patchEndpoint, patchNotification, registerEndpoint } from "../handlers/notifications.js";
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

    /* client browser id */
    router.put(
        '/push/:id',
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

    router.head(
        '/push/:id',
        keycloak.protect(),
        async (req, res, next) => {
            try {
                await checkEndpoint(req, res, next);
            } catch (err) {
                next(err);
            }
        }
    );

    router.patch(
        '/push/:id',
        keycloak.protect(),
        maybeFetchUserId,
        async (req, res, next) => {
            try {
                await patchEndpoint(req, res, next);
            } catch (err) {
                next(err);
            }
        }
    );
}
