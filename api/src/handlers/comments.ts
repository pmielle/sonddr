import { Request, Response, NextFunction } from "express";
import { DbComment, DbIdea, localized_comment_end, localized_comment_start, } from "sonddr-shared";
import { deleteDocument, getDocument, getDocuments, patchDocument, postDocument } from "../database.js";
import { _getFromReqBody, _getReqPath, _getUnique } from "../utils.js";
import { Filter, } from "../types/types.js";
import { reviveComment, reviveComments } from "../revivers/comments.js";
import { start } from "node:repl";

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

export async function postComment(req: Request, res: Response, _: NextFunction) {
    const ideaId = _getFromReqBody("ideaId", req);
    const payload = {
        ideaId: ideaId,
        content: _getFromReqBody("content", req),
        location: req.body["location"],  // might be undef
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
