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
    const location: [number, number]|undefined = req.body["location"];
    const payload = {
        ideaId: ideaId,
        content: _getFromReqBody("content", req),
        location: location,
        authorId: req["userId"],
        date: new Date(),
        rating: 0,
    };
    const insertedId = await postDocument(_getReqPath(req), payload);
    if (location) {
        let ideaContent = (await getDocument<DbIdea>(`ideas/${ideaId}`)).content;
        ideaContent = _insertSpans(ideaContent, location, insertedId);
        await patchDocument(
            `ideas/${ideaId}`,
            { field: "content", operator: "set", value: ideaContent }
        );
    }
    res.json({ insertedId: insertedId });
}

export async function deleteComment(req: Request, res: Response, _: NextFunction) {
    const comment = await getDocument<DbComment>(_getReqPath(req));
    if (comment.authorId !== req["userId"]) { throw new Error("Unauthorized"); }
    await deleteDocument(_getReqPath(req));
    res.send();
}

// private
// --------------------------------------------
function _insertSpans(content: string, location: [number, number], commentId: string): string {
    // validate inputs
    let [startOffset, endOffset] = location;
    if (startOffset < 0) { throw new Error(`startOffset=${startOffset} must be positive`); }
    if (startOffset >= endOffset) { throw new Error(`endOffset=${endOffset} must be greater than startOffset=${startOffset}`); }
    // walk through the content html and insert
    let inTag = false;
    const startSpan = `<span id="${localized_comment_start}${commentId}"></span>`;
    const endSpan = `<span id="${localized_comment_end}${commentId}"></span>`;
    let offset = 0; 
    // 'i' counts the actual offset in the content html string
    // while 'offset' counts only text chars, ignoring html tags
    for (let i = 0; i < content.length; i++) {

        if (content[i] === "<") { inTag = true; continue; }
        if (inTag) {
            if (content[i] === ">") { inTag = false; }
            continue;
        }
        // at this point, we are in a text node (right?)
        // is there something to add here? 
        if (offset === startOffset) {
            content = _insert(startSpan, content, i);
            i += startSpan.length;  // ignore inserted chars
        } else if (offset === endOffset) {
            content = _insert(endSpan, content, i);
            break;
        }
        offset += 1; // yes, in all cases
    }
    if (offset < endOffset) {
        // should not happen
        throw new Error(`endOffset=${endOffset} was not reached while walking through content`);
    }
    return content;
}

function _insert(substr: string, str: string, offset: number): string {
    if (offset >= str.length) { throw new Error(`offset must be smaller than str.length`); }
    return str.slice(0, offset) + substr + str.slice(offset);
}
