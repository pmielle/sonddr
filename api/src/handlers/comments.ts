import { Request, Response, NextFunction } from "express";
import { DbComment, } from "sonddr-shared";
import { deleteDocument, getDocument, getDocuments, postDocument } from "../database.js";
import { _getFromReqBody, _getReqPath, _getUnique } from "../utils.js";
import { Filter, } from "../types/types.js";
import { reviveComment, reviveComments } from "../revivers/comments.js";

export async function postComment(req: Request, res: Response, _: NextFunction) {
	const payload = {
		ideaId: _getFromReqBody("ideaId", req),
		content: _getFromReqBody("content", req),
		authorId: req["userId"],
		date: new Date(),
		rating: 0,
	};
	const insertedId = await postDocument(_getReqPath(req), payload);
	res.json({ insertedId: insertedId });
}

export async function deleteComment(req: Request, res: Response, _: NextFunction) {
	const comment = await getDocument<DbComment>(_getReqPath(req));
	if (comment.authorId !== req["userId"]) { throw new Error("Unauthorized"); }
	await deleteDocument(_getReqPath(req));
	res.send();
}

export async function getComments(req: Request, res: Response, _: NextFunction) {
	const order = req.query.order || "date";
	const ideaId = req.query.ideaId;
	const authorId = req.query.authorId;
	const filters: Filter[] = [];
	if (ideaId) {
		filters.push({ field: "ideaId", operator: "eq", value: ideaId });
	}
	if (authorId) {
		filters.push({ field: "authorId", operator: "eq", value: authorId });
	}
	const docs = await getDocuments<DbComment>(
		_getReqPath(req),
		{ field: order as string, desc: true },
		filters
	).then(dbDocs => reviveComments(dbDocs, req["userId"]));
	res.json(docs);
}

export async function getComment(req: Request, res: Response, _: NextFunction) {
	const doc = await getDocument<DbComment>(_getReqPath(req))
		.then(dbDoc => reviveComment(dbDoc, req["userId"]));
	res.json(doc);
}
