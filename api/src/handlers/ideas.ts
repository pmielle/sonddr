import { Request, Response, NextFunction } from "express";
import { DbIdea } from "sonddr-shared";
import { Filter, Patch } from "../types/types.js";
import { deleteDocument, getDocument, getDocuments, patchDocument, postDocument } from "../database.js";
import { _getFromReqBody, _getReqPath, _getUnique, _getUniqueInArray } from "../utils.js";
import { reviveIdea, reviveIdeas } from "../revivers/ideas.js";

export async function getIdeas(req: Request, res: Response, _: NextFunction) {
	const order = req.query.order || "date";
	const goalId = req.query.goalId;
	const authorId = req.query.authorId;
	const regex = req.query.regex;
	const filters: Filter[] = [];
	if (goalId) {
		filters.push({ field: "goalIds", operator: "in", value: [goalId] });
	}
	if (authorId) {
		filters.push({ field: "authorId", operator: "eq", value: authorId });
	}
	if (regex) {
		filters.push({ field: "title", operator: "regex", value: regex });
	}
	const docs = await getDocuments<DbIdea>(
		_getReqPath(req),
		{ field: order as string, desc: true },
		filters
	).then(dbDocs => reviveIdeas(dbDocs, req["userId"]));
	res.json(docs);
}

export async function getIdea(req: Request, res: Response, _: NextFunction) {
	const doc = await getDocument<DbIdea>(_getReqPath(req))
		.then(dbDoc => reviveIdea(dbDoc, req["userId"]));
	res.json(doc);
}

export async function postIdea(req: Request, res: Response, _: NextFunction) {
	let content = _getFromReqBody<string>("content", req);
	const cover: Express.Multer.File | undefined = req.files["cover"]?.pop();
	const images: Express.Multer.File[] | undefined = req.files["images"];
	images?.forEach((image) => {
		content = content.replace(
			new RegExp(`<img src=".+?" id="${image.originalname}">`),
			`<img src="${image.filename}">`
		);
	});
	const payload = {
		title: _getFromReqBody("title", req),
		authorId: req["userId"],
		goalIds: JSON.parse(_getFromReqBody("goalIds", req)),
		content: content,
		externalLinks: [],
		date: new Date(),
		supports: 0,
		cover: cover ? cover.filename : undefined,
	};
	const insertedId = await postDocument(_getReqPath(req), payload);
	res.json({ insertedId: insertedId });
}

export async function deleteIdea(req: Request, res: Response, _: NextFunction) {
	const idea = await getDocument<DbIdea>(_getReqPath(req));
	if (idea.authorId !== req["userId"]) { throw new Error("Unauthorized"); }
	await deleteDocument(_getReqPath(req));
	res.send();
}

export async function patchIdea(req: Request, res: Response, _: NextFunction) {
	// only the idea author is allowed to edit
	const path = _getReqPath(req);
	const idea = await getDocument<DbIdea>(path);
	if (!idea) { throw new Error(`Idea not found`); }
	if (!idea.authorId === req["userId"]) { throw new Error(`Unauthorized`); }

	// find fields to update
	let content = req.body["content"];
	const title = req.body["title"];
	const goalIds = req.body["goalIds"];
	const cover: Express.Multer.File | undefined = req.files?.["cover"]?.pop();
	if (content !== undefined) {
		const images: Express.Multer.File[] | undefined = req.files?.["images"];
		images?.forEach((image) => {
			content = content.replace(
				new RegExp(`<img src=".+?" id="${image.originalname}">`),
				`<img src="${image.filename}">`
			);
		});
		// images that were already present should be re-formatted to remove any prefix added by the frontend
		content = content.replace(/<img src=".*\/(.*)">/g, `<img src="$1">`);
	}
	let patches: Patch[] = [];
	if (content !== undefined) { patches.push({ operator: "set", field: "content", value: content }); }
	if (title !== undefined) { patches.push({ operator: "set", field: "title", value: title }); }
	if (goalIds !== undefined) { patches.push({ operator: "set", field: "goalIds", value: JSON.parse(goalIds) }); }
	if (cover !== undefined) { patches.push({ operator: "set", field: "cover", value: cover.filename }); }
	if (patches.length > 0) {
		await patchDocument(path, patches);
	}

	// find links to remove or to add
	const linkToRemove = req.body["removeExternalLink"];
	const linkToAdd = req.body["addExternalLink"];
	if (linkToRemove) {
		await patchDocument(path, {
			field: 'externalLinks',
			operator: 'pull',
			value: { type: linkToRemove.type },
		});
	}
	if (linkToAdd) {
		await patchDocument(path, {
			field: 'externalLinks',
			operator: 'addToSet',
			value: linkToAdd,
		});
	}

	// respond
	res.send();
}

