import { Request, Response, NextFunction } from "express";

import { DbIdea, DbVolunteer, Volunteer } from "sonddr-shared";
import { deleteDocument, getDocument, getDocuments, patchDocument, postDocument } from "../database.js";
import { _getFromReqBody, _getReqPath, _getUnique } from "../utils.js";
import { Filter } from "../types/types.js";
import { reviveVolunteer, reviveVolunteers } from "../revivers/volunteers.js";


export async function postVolunteer(req: Request, res: Response, _: NextFunction) {
	const userId = req["userId"];
	const ideaId = _getFromReqBody("ideaId", req);
	const dbIdea = await getDocument<DbIdea>(`ideas/${ideaId}`);
	if (dbIdea.authorId !== userId) {
		throw new Error("Unauthorized");
	}
	const payload = {
		ideaId: ideaId, 
		description: _getFromReqBody("description", req),
		candidateIds: [],
	};
	const insertedId = await postDocument(_getReqPath(req), payload);
	res.json({ insertedId: insertedId });
}

export async function deleteVolunteer(req: Request, res: Response, _: NextFunction) {
	const userId = req["userId"];
	const volunteer = await getDocument<DbVolunteer>(_getReqPath(req))
		.then(dbVolunteer => reviveVolunteer(dbVolunteer, userId));
	if (userId !== volunteer.user?.id && userId !== volunteer.idea.author.id) {
		throw new Error("Unauthorized"); 
	}
	await deleteDocument(_getReqPath(req));
	res.send();
}

export async function getVolunteers(req: Request, res: Response, _: NextFunction) {
	const userId = req["userId"];
	const ideaIdFilter = req.query.ideaId;
	const userIdFilter = req.query.userId;
	const filters: Filter[] = [];
	if (ideaIdFilter) { filters.push({ field: "ideaId", operator: "eq", value: ideaIdFilter }); }
	if (userIdFilter) { filters.push({ field: "userId", operator: "eq", value: userIdFilter }); }
	const dbDocs = await getDocuments<DbVolunteer>(_getReqPath(req), undefined, filters);
	if (dbDocs.length == 0) { res.json([]); return; }
	const docs = await reviveVolunteers(dbDocs, userId);
	res.json(docs);
}

export async function patchVolunteer(req: Request, res: Response, _: NextFunction) {

	const userId = req["userId"];
	const path = _getReqPath(req);
	const removeCandidate = req.body["removeCandidate"];
	const addCandidate = req.body["addCandidate"];
	const acceptCandidate = req.body["acceptCandidate"];
	const refuseCandidate = req.body["refuseCandidate"];
	const removeUser = req.body["removeUser"];
	const v = await getDocument<DbVolunteer>(path)
		.then(dbDoc => reviveVolunteer(dbDoc, userId));

	// remove current user
	if (removeUser && isAdmin(userId, v)) {
		await patchDocument(path, {
			field: 'userId',
			operator: 'unset',
			value: '',
		});
	}

	// add or remove self from the list of candidates
	if (removeCandidate) {
		await patchDocument(path, {
			field: 'candidateIds',
			operator: 'pull',
			value: userId,
		});
	}
	if (addCandidate) {
		await patchDocument(path, {
			field: 'candidateIds',
			operator: 'addToSet',
			value: userId,
		});
	}

	// accept or refuse a candidate
	if (refuseCandidate && isAdmin(userId, v)) {
		await patchDocument(path, {
			field: 'candidateIds',
			operator: 'pull',
			value: refuseCandidate,
		});
	}
	if (acceptCandidate && isAdmin(userId, v)) {
		await Promise.all([
			patchDocument(path, {
				field: 'userId',
				operator: 'set',
				value: acceptCandidate,
			}),
			patchDocument(path, {
				field: 'candidateIds',
				operator: 'pull',
				value: acceptCandidate,
			}),
		]);
	}

	// respond
	res.send();
}

// private
// --------------------------------------------
async function isAdmin(userId: string, v: Volunteer) {
	if (v.idea.author.id !== userId) {
		throw new Error("Unauthorized");
	}
}
