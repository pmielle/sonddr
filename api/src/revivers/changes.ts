import { Change, } from "sonddr-shared";

export async function reviveChange<DbT, T>(
	change: Change<DbT>, 
	reviver: (x: DbT, ...extraParams: any) => Promise<T>, 
	...reviverExtraParams: any
): Promise<Change<T>> {
	const toRevive = [];
	let beforeFlag: boolean;
	if (change.docBefore) { 
		toRevive.push(change.docBefore); beforeFlag = true; 
	} else { 
		beforeFlag = false; 
	}
	if (change.docAfter) { toRevive.push(change.docAfter) }
	const revived = await Promise.all(
		toRevive.map(x => reviver(x, ...reviverExtraParams))
	);
	let docBefore: T;
	let docAfter: T;
	if (revived.length === 1) {
		if (beforeFlag) {
			docBefore = revived[0]
		} else {
			docAfter = revived[0];
		}
	} else if (revived.length === 2) {
		[docBefore, docAfter] = revived;
	} else { 
		throw new Error("Failed to revive change");
	}
	return { ...change, docBefore: docBefore, docAfter: docAfter };
}
