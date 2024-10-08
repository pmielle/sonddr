import { Request, Response, NextFunction } from "express";
import { Goal } from "sonddr-shared";
import { getDocument, getDocuments } from "../database.js";
import { _getReqPath } from "../utils.js";

export async function getGoals(req: Request, res: Response, _: NextFunction) {
	const docs = await getDocuments<Goal>(_getReqPath(req), { field: "order", desc: false });
	res.json(docs);
}

export async function getGoal(req: Request, res: Response, _: NextFunction) {
	const doc = await getDocument<Goal>(_getReqPath(req));
	res.json(doc);
}
