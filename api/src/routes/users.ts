import { Router } from "express";
import { maybeFetchUserId, keycloak } from "../auth.js";
import { upload } from "../uploads.js";
import { getUser, getUsers, patchUser, putUser } from "../handlers/users.js";

export function addUsersRoutes(router: Router) {

	router.get('/users/:id',
		maybeFetchUserId,
		async (req, res, next) => {
			try {
				await getUser(req, res, next);
			} catch (err) {
				next(err);
			}
		});

	router.get('/users',
		maybeFetchUserId,
		async (req, res, next) => {
			try {
				await getUsers(req, res, next);
			} catch (err) {
				next(err);
			}
		});

	router.patch(`/users/:id`,
		keycloak.protect(),
		maybeFetchUserId,
		upload([{ name: "cover", maxCount: 1 }, { name: "profilePicture", maxCount: 1 },]),
		async (req, res, next) => {
			try {
				await patchUser(req, res, next);
			} catch (err) {
				next(err);
			}
		});

	router.put('/users/:id',
		keycloak.protect(),
		maybeFetchUserId,
		async (req, res, next) => {
			try {
				await putUser(req, res, next);
			} catch (err) {
				next(err);
			};
		});

}
