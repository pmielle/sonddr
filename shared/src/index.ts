export * from "./types.js";

export function makeCheerId(ideaId: string, userId: string): string {
	return `${ideaId}-${userId}`;
}

export function makeVoteId(commentId: string, userId: string): string {
	return `${commentId}-${userId}`;
}

export function isChange(obj: any): boolean {
	return 'docId' in obj && 'type' in obj;
}

export const placeholder_id = "PLACEHOLDER_ID";

export const ping_str = "SONDDR_PING";

export const delete_str = "SONDDR_DELETE";
