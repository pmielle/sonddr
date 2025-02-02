export type Push = {
    id: string,
    userId: string,
    subscription: any,  // should be PushSubscription but tsc does not find it for some reason
};

export type Draft = {
    id: string,
    title?: string,
    authorId: string,
    goalIds?: string[],
    content?: string,
};

export type HeadResponse = {
    exists: boolean,
};

export type PostResponse = {
    insertedId: string,
};

export type Change<T> = {
    type: "delete"|"insert"|"update",
    docId: string,
    docBefore?: T,
    docAfter?: T,
};

export type Doc = {
    id: string,
    [key: string]: any,
};

export type Goal = {
    id: string,
    color: string,
    icon: string,
    order: number,
    "name-en": string,
    "header-en": string,
    "name-fr": string,
    "header-fr": string,
};

export type Idea = {
    id: string,
    title: string,
    author: User,
    goals: Goal[],
    externalLinks: ExternalLink[],
    date: Date,
    content: string,
    supports: number,
    userHasCheered: boolean,
    cover?: string,
    summary?: string,
};

export type DbIdea = {
    id: string,
    title: string,
    authorId: string,
    goalIds: string[],
    externalLinks: ExternalLink[],
    date: Date,
    content: string,
    supports: number,
    cover?: string,
    summary?: string,
};

export type DbVolunteer = {
    id: string,
    ideaId: string,
    userId?: string, // undef means not fulfilled yet
    description: string,
    candidateIds: string[],
};

export type Volunteer = {
    id: string,
    idea: Idea,
    user?: User,
    description: string,
    candidates: User[],
};

export type Comment = {
    id: string,
    author: User,
    ideaId: string,
    date: Date,
    content: string,
    rating: number,
    location?: [number, number],
    userVote?: 1|-1,
};

export type DbComment = {
    id: string,
    authorId: string,
    ideaId: string,
    date: Date,
    content: string,
    rating: number,
    location?: [number, number],
};

export type DbUser = {
    id: string,
    name: string,
    date: Date,
    externalLinks: ExternalLink[],
    bio: string,
    cover?: string,
    profilePicture?: string,
}

export type User = {
    id: string,
    name: string,
    date: Date,
    externalLinks: ExternalLink[],
    bio: string,
    isUser: boolean,
    cover?: string,
    profilePicture?: string,
};

export const externalLinkTypes = ["x", "instagram", "discord", "slack", "googledrive", "github"] as const;
export type ExternalLinkType = typeof externalLinkTypes[number]; // https://jaketrent.com/post/loop-typescript-union-type/

export type ExternalLink = {
    type: ExternalLinkType,
    url: string,
};

export type Discussion = {
    id: string,
    users: User[],
    date: Date,
    lastMessage: Message,
    readByIds: string[],
};

export type DbDiscussion = {
    id: string,
    userIds: string[],
    date?: Date,
    lastMessageId?: string,
    readByIds: string[],
};

export type Notification = {
    id: string,
    toIds: string[],
    content: string,
    date: Date,
    readByIds: string[],
    href?: string,
    picture?: string,
};

export type Message = {
    id: string,
    discussionId: string,
    author: User,
    date: Date,
    content: string,
    deleted: boolean,
    reactions?: Reaction[],
    userReaction?: string,
    img?: string,
};

export type DbReaction = {
    emoji: string,
    fromUserIds: string[],
}

export type Reaction = {
    emoji: string,
    fromUsers: User[],
}

export type DbMessage = {
    id: string,
    discussionId: string,
    authorId: string,
    date: Date,
    content: string,
    deleted: boolean,
    reactions?: DbReaction[],
    img?: string,
};

export type Cheer = {
    id: string,
    authorId: string,
    ideaId: string,
};

export type Vote = {
    id: string,
    authorId: string,
    commentId: string,
    value: 1|-1,
};
