import { Request, Response, NextFunction } from "express";

import { Cheer, makeCheerId } from "sonddr-shared";
import { deleteDocument, getDocument, putDocument } from "../database.js";
import { _getFromReqBody, _getReqPath } from "../utils.js";


export async function putCheer(req: Request, res: Response, _: NextFunction) {
	const ideaId = _getFromReqBody("ideaId", req);
	const userId = req["userId"];
	const id = makeCheerId(ideaId as string, userId);
	const payload = {
		id: id,
		ideaId: ideaId,
		authorId: userId,
	};
	await putDocument(_getReqPath(req), payload);
	res.send();
}

export async function getCheer(req: Request, res: Response, _: NextFunction) {
	const doc = await getDocument<Cheer>(_getReqPath(req));
	res.json(doc);
}

export async function deleteCheer(req: Request, res: Response, _: NextFunction) {
	const doc = await getDocument<Cheer>(_getReqPath(req));
	if (doc.authorId !== req["userId"]) {
		throw new Error(`${req["userId"]} is not the author of the cheer`);
	}
	await deleteDocument(_getReqPath(req));
	res.send();
}
