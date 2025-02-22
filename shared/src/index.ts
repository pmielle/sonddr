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
export const react_str = "SONDDR_REACT_ADD";
export const delete_react_str = "SONDDR_REACT_DELETE";
export const sep_str = "@@@";
export const localized_comment_start = "start:";
export const localized_comment_end = "end:";
export const localized_comment_deleted = [-1, -1] as const;
