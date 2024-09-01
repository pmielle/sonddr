import { Request, Response, NextFunction } from "express";
import { Draft } from "sonddr-shared";
import { Filter, Patch } from "../types/types.js";
import { deleteDocument, getDocument, getDocuments, patchDocument, postDocument } from "../database.js";
import { _getFromReqBody, _getReqPath } from "../utils.js";

export async function getDrafts(req: Request, res: Response, _: NextFunction) {
	const authorId = req.query.authorId;
	let filter: Filter = undefined;
	if (authorId) {
		filter = { field: "authorId", operator: "eq", value: authorId };
	}
	const docs = await getDocuments<Draft>(_getReqPath(req), undefined, filter);
	res.json(docs);
}

export async function postDraft(req: Request, res: Response, _: NextFunction) {
	const payload = {
		title: req.body["title"],
		authorId: req["userId"],
		goalIds: req.body["goalIds"] ? JSON.parse(req.body["goalIds"]) : undefined,
		content: req.body["content"],
	};
	const insertedId = await postDocument(_getReqPath(req), payload);
	res.json({ insertedId: insertedId });
}

export async function deleteDraft(req: Request, res: Response, _: NextFunction) {
	const draft = await getDocument<Draft>(_getReqPath(req));
	if (draft.authorId !== req["userId"]) { throw new Error("Unauthorized"); }
	await deleteDocument(_getReqPath(req));
	res.send();
}

export async function patchDraft(req: Request, res: Response, _: NextFunction) {
	// only the draft author is allowed to edit
	const path = _getReqPath(req);
	const draft = await getDocument<Draft>(path);
	if (!draft.authorId === req["userId"]) { throw new Error(`Unauthorized`); }

	// find fields to update
	let content = req.body["content"];
	const title = req.body["title"];
	const goalIds = req.body["goalIds"];
	let patches: Patch[] = [];
	if (content !== undefined) { patches.push({ operator: "set", field: "content", value: content }); }
	if (title !== undefined) { patches.push({ operator: "set", field: "title", value: title }); }
	if (goalIds !== undefined) { patches.push({ operator: "set", field: "goalIds", value: JSON.parse(goalIds) }); }
	if (patches.length > 0) {
		await patchDocument(path, patches);
	}

	// respond
	res.send();
}

