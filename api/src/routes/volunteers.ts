import { Router } from "express";
import { deleteVolunteer, getVolunteers, patchVolunteer, postVolunteer } from "../handlers/volunteers.js";
import { fetchUserId, keycloak } from "../auth.js";

export function addVolunteersRoutes(router: Router) {

	router.get('/volunteers',
		async (req, res, next) => {
			try {
				await getVolunteers(req, res, next);
			} catch (err) {
				next(err);
			}
		});

	router.post('/volunteers',
		keycloak.protect(),
		fetchUserId,
		async (req, res, next) => {
			try {
				await postVolunteer(req, res, next);
			} catch (err) {
				next(err);
			}
		});

	router.delete('/volunteers/:id',
		keycloak.protect(),
		fetchUserId,
		async (req, res, next) => {
			try {
				await deleteVolunteer(req, res, next);
			} catch (err) {
				next(err);
			}
		});

	router.patch('/volunteers/:id',
		keycloak.protect(),
		fetchUserId,
		async (req, res, next) => {
			try {
				await patchVolunteer(req, res, next);
			} catch (err) {
				next(err);
			}
		});

}
