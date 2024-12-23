import { Request } from "express";

export function _getUnique<T extends object, U extends keyof T>(collection: T[], key: U): T[U][] {
	return Array.from(collection.reduce((result, current) => {
		if (key in current) {  // key might be optional
			result.add(current[key] as T[U]);
		}
		return result;
	}, new Set<T[U]>).values());
}

export function _getUniqueInArray<T extends object, U extends keyof T>(collection: T[], key: U): T[U] {
	return Array.from(collection.reduce((result, current) => {
        // - 'current' might be optional in some edge cases (e.g. nested optional object)
        // - key might be optional
        if (current && key in current) {  // might be optional
            (current[key] as any).forEach((item: any) => {
                result.add(item);
            });
        }
		return result;
	}, new Set<any>).values()) as T[U];
}

export function _getReqPath(req: Request): string {
	let path = req.path;
	if (path.charAt(0) == "/") {
		path = path.substring(1);
	}
	return path;
}

export function _getFromReqBody<T>(key: string, req: Request): T {
	const value = req.body[key];
	if (value === undefined) { throw new Error(`${key} not found in request body`); }
	return value;
}
