import { Request, Response, NextFunction } from "express";
import { filter as rxFilter } from "rxjs";
import { Change, Notification, ping_str, Push } from "sonddr-shared";
import { SSE } from "../types/sse.js";
import { deleteDocument, getDocument, getDocuments, patchDocument, postDocument } from "../database.js";
import { _getFromReqBody, _getReqPath, _getUnique } from "../utils.js";
import { notificationsChanges$ } from "../triggers/triggers.js";

export function getVapidPublicKey(_req: Request, res: Response, _next: NextFunction) {
    let val = process.env["VAPID_PUBLIC_KEY"];
    if (!val) { throw new Error("Failed to get vapid public key from the environment"); }
    res.json(val);
}

export async function registerEndpoint(req: Request, res: Response, _: NextFunction) {
	const payload = {
        userId: req["userId"],
		url: _getFromReqBody("url", req),
    };
	const insertedId = await postDocument(_getReqPath(req), payload);
	res.json({ insertedId: insertedId });
}

export async function deleteEndpoint(req: Request, res: Response, _: NextFunction) {
	const userId = req["userId"];
	const push = await getDocument<Push>(_getReqPath(req));
	if (userId !== push.userId) {
		throw new Error("Unauthorized"); 
	}
	await deleteDocument(_getReqPath(req));
	res.send();
}

export async function getNotifications(req: Request, res: Response, _: NextFunction) {
	const userId = req["userId"];
	const sse = new SSE(res);
	const docs = await getDocuments<Notification>(
		_getReqPath(req),
		{ field: "date", desc: true },
		{ field: "toIds", operator: "in", value: [userId] },
	);
	sse.send(docs);
	const changesSub = notificationsChanges$.pipe(
		rxFilter(change => _getToIdsOfNotificationChange(change).includes(userId)),
	).subscribe(change => sse.send(change));
	// heartbeat to keep the connection alive
	// otherwise nginx timeouts after 60s
	const pingId = setInterval(() => sse.send(ping_str), 30000);
	req.on("close", () => {
		clearInterval(pingId);
		changesSub.unsubscribe()
	});
}

export async function patchNotification(req: Request, res: Response, _: NextFunction) {
	await patchDocument(
		_getReqPath(req),
		{ field: 'readByIds', operator: 'addToSet', value: req["userId"] }
	);
	res.send();
}

// private
// --------------------------------------------
function _getToIdsOfNotificationChange(change: Change<Notification>): string[] {
	const toIds = change.docBefore?.toIds || change.docAfter?.toIds;
	if (!toIds) { throw new Error("Failed to find toIds of change"); }
	return toIds;
}

