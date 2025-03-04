import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Cheer, Discussion, Goal, Idea, Message, HeadResponse, PostResponse, User, makeCheerId, makeVoteId, Comment, ExternalLink, Volunteer, Draft } from 'sonddr-shared';
import { SortBy } from '../components/idea-list/idea-list.component';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HttpService {

  // dependencies
  // --------------------------------------------
  private db = inject(HttpClient);

  // attributes
  // --------------------------------------------
  private basePath = "/api";
  private goals?: Goal[];

  // lifecycle hooks
  // --------------------------------------------
  constructor() { }

  // public methods
  // --------------------------------------------

  async getVapidPublicKey(): Promise<string> {
    return this._get<string>(`/vapid`);
  }

  async checkSubcription(subId: string): Promise<boolean> {
    return this._head(`/push/${subId}`);
  }

  async registerSubscription(id: string, sub: PushSubscription) {
    return this._put(`/push/${id}`, {subscription: sub});
  }

  async updateSubscriptionUser(subId: string) {
    return this._patch(`/push/${subId}`, {active: true});
  }

  async deleteSubscriptionUser(subId: string) {
    return this._patch(`/push/${subId}`, {active: false});
  }

  async deleteDraft(draftId: string): Promise<void> {
    return this._delete(`/drafts/${draftId}`);
  }

  async editDraft(draftId: string, title?: string, content?: string, goals?: Goal[]) {
    const payload = {
      title: title,
      content: content,
      goalIds: goals !== undefined ? JSON.stringify(goals.map(g => g.id)) : undefined,
    };
    this._patch(`/drafts/${draftId}`, payload);
  }

  async getDrafts(authorId: string): Promise<Draft[]> {
    let uri = `drafts?authorId=${authorId}`;
    return this._get<Draft[]>(uri);
  }

  async createDraft(title?: string, content?: string, goals?: Goal[]): Promise<string> {
    const payload = {
      title: title,
      content: content,
      goalIds: goals !== undefined ? JSON.stringify(goals.map(g => g.id)) : undefined,
    };
    return this._post(`/drafts`, payload);
  }

  async addVolunteerCandidate(volunteerId: string) {
    return this._patch(`volunteers/${volunteerId}`, {addCandidate: true});
  }

  async removeVolunteerCandidate(volunteerId: string) {
    return this._patch(`volunteers/${volunteerId}`, {removeCandidate: true});
  }

  async acceptVolunteerCandidate(volunteerId: string, candidateId: string) {
    return this._patch(`volunteers/${volunteerId}`, {acceptCandidate: candidateId});
  }

  async refuseVolunteerCandidate(volunteerId: string, candidateId: string) {
    return this._patch(`volunteers/${volunteerId}`, {refuseCandidate: candidateId});
  }

  async removeVolunteerUser(volunteerId: string) {
    return this._patch(`volunteers/${volunteerId}`, {removeUser: true})
  }

  async deleteVolunteer(volunteerId: string) {
    return this._delete(`volunteers/${volunteerId}`);
  }

  async editUser(userId: string, name?: string, bio?: string, cover?: File, profilePicture?: File) {
    const formData = new FormData();
    if (name !== undefined) { formData.append("name", name); }
    if (bio !== undefined) { formData.append("bio", bio); }
    if (cover) { formData.append("cover", cover); }
    if (profilePicture) { formData.append("profilePicture", profilePicture); }
    this._patch(`/users/${userId}`, formData);
  }

  // images is a map with local ids as keys and actual files as values
  // it is needed because the backend needs a way to tell which image matches which img tag
  async editIdea(ideaId: string, title?: string, content?: string, goals?: Goal[], cover?: File, images?: Map<string, File>) {
    const formData = new FormData();
    if (title !== undefined) { formData.append("title", title); }
    if (content !== undefined) { formData.append("content", content); }
    if (goals !== undefined) { formData.append("goalIds", JSON.stringify(goals.map(g => g.id))); }
    if (cover) { formData.append("cover", cover); }
    if (images) { images.forEach((file, url, _) => {
      let id = this._getIdOfObjectUrl(url);
      formData.append("images", file, id);
    }); }
    this._patch(`/ideas/${ideaId}`, formData);  // multer needs a multipart/form-data
  }

  async addIdeaExternalLink(ideaId: string, externalLink: ExternalLink): Promise<void> {
    return this._addExternalLink("idea", ideaId, externalLink);
  }

  async deleteIdeaExternalLink(ideaId: string, externalLink: ExternalLink): Promise<void> {
    return this._deleteExternalLink("idea", ideaId, externalLink);
  }

  async addUserExternalLink(userId: string, externalLink: ExternalLink): Promise<void> {
    return this._addExternalLink("user", userId, externalLink);
  }

  async deleteUserExternalLink(userId: string, externalLink: ExternalLink): Promise<void> {
    return this._deleteExternalLink("user", userId, externalLink);
  }

  async deleteIdea(ideaId: string): Promise<void> {
    return this._delete(`/ideas/${ideaId}`);
  }

  async deleteComment(commentId: string): Promise<void> {
    return this._delete(`/comments/${commentId}`);
  }

  async markDiscussionAsRead(discussionId: string): Promise<void> {
    return this._patch(`/discussions/${discussionId}`, {});
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    return this._patch(`/notifications/${notificationId}`, {});
  }

  // sometimes a local url is used,
  // otherwise it is assumed to be the basename of an image on the server
  getImageUrl(str: string): string {
    return str.startsWith("blob:")
      ? str
      : `${this.basePath}/uploads/${str}`;
  }

  async deleteVote(commentId: string, userId: string) {
    const id = makeVoteId(commentId, userId);
    return this._delete(`votes/${id}`);
  }

  async upvoteComment(commentId: string, userId: string) {
    const id = makeVoteId(commentId, userId);
    return this._put(`votes/${id}`, {commentId: commentId, value: 1});
  }

  async downvoteComment(commentId: string, userId: string) {
    const id = makeVoteId(commentId, userId);
    return this._put(`votes/${id}`, {commentId: commentId, value: -1});
  }

  async deleteCheer(ideaId: string, userId: string) {
    const id = makeCheerId(ideaId, userId);
    return this._delete(`cheers/${id}`);
  }

  async getCheer(ideaId: string, userId: string): Promise<Cheer> {
    const id = makeCheerId(ideaId, userId);
    return this._get<Cheer>(`cheers/${id}`);
  }

  async cheer(ideaId: string, userId: string): Promise<void> {
    const id = makeCheerId(ideaId, userId);
    return this._put(`cheers/${id}`, {ideaId: ideaId});
  }

  async getComment(id: string): Promise<Comment> {
    return this._get<Comment>(`comments/${id}`);
  }

  async postComment(ideaId: string, content: string, location?: [number, number]): Promise<string> {
    return this._post("comments", {ideaId: ideaId, content: content, location: location});
  }

  async getMessage(id: string): Promise<Message> {
    return this._get<Message>(`messages/${id}`);
  }

  async searchIdeas(titleRegex: string): Promise<Idea[]> {
    return this._get<Idea[]>(`ideas?regex=${titleRegex}`);
  }

  async createNewDiscussion(toUserId: string, firstMessageContent: string): Promise<string> {
    return this._post("discussions", {toUserId: toUserId, firstMessageContent: firstMessageContent});
  }

  async searchUsers(nameRegex: string): Promise<User[]> {
    return this._get<User[]>(`users?regex=${nameRegex}`);
  }

  // images is a map with local ids as keys and actual files as values
  // it is needed because the backend needs a way to tell which image matches which img tag
  async postIdea(title: string, content: string, goalIds: string[], cover?: File, images?: Map<string, File>): Promise<string> {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("goalIds", JSON.stringify(goalIds));
    if (cover) { formData.append("cover", cover); }
    if (images) { images.forEach((file, url, _) => {
      let id = this._getIdOfObjectUrl(url);
      formData.append("images", file, id);
    }); }
    return this._post(`ideas`, formData);  // multer needs a multipart/form-data
  }

  _getIdOfObjectUrl(url: string): string {
    let match = url.match(/\/([^\/]+)$/);
    if (! match) {  throw Error(`Failed to get id of objecturl: ${url}`); }
    return match[1];
  }

  async createUser(id: string, name: string): Promise<void> {
    return this._put(`users/${id}`, {name: name});
  }

  async getUser(id: string): Promise<User> {
    return this._get<User>(`users/${id}`);
  }

  async getIdea(id: string): Promise<Idea> {
    return this._get<Idea>(`ideas/${id}`);
  }

  async getGoal(id: string): Promise<Goal> {
    return this._get<Goal>(`goals/${id}`);
  }

  async getGoals(): Promise<Goal[]> {
    // return from cache
    if (this.goals) {
      return structuredClone(this.goals);
    }
    // get from db + add to cache + return
    const goals = await this._get<Goal[]>("goals");
    this.goals = goals;
    return goals;
  }

  async getIdeas(sortBy: SortBy, goalId?: string, authorId?: string): Promise<Idea[]> {
    let uri = "ideas";
    switch (sortBy) {
      case "recent": uri += "?order=date"; break;
      case "popular": uri += "?order=supports"; break;
      default: throw new Error(`unexpected sortBy: ${sortBy}`);
    }
    if (goalId) { uri += `&goalId=${goalId}`; }
    if (authorId) { uri += `&authorId=${authorId}`; }
    return this._get<Idea[]>(uri);
  }

  async createVolunteer(ideaId: string, description: string): Promise<string> {
    return this._post("volunteers", {ideaId: ideaId, description: description});
  }

  async getVolunteers(ideaId?: string, userId?: string): Promise<Volunteer[]> {
    let uri = "volunteers";
    const filters: string[] = [];
    if (ideaId) { filters.push(`&ideaId=${ideaId}`); }
    if (userId) { filters.push(`&authorId=${userId}`); }
    if (filters.length) { uri += "?" + filters.join("&"); }
    return this._get<Volunteer[]>(uri);
  }

  async getComments(sortBy: SortBy, ideaId?: string, authorId?: string): Promise<Comment[]> {
    let uri = "comments";
    switch (sortBy) {
      case "recent": uri += "?order=date"; break;
      case "popular": uri += "?order=rating"; break;
      default: throw new Error(`unexpected sortBy: ${sortBy}`);
    }
    if (ideaId) { uri += `&ideaId=${ideaId}`; }
    if (authorId) { uri += `&authorId=${authorId}`; }
    return this._get<Comment[]>(uri);
  }

  async getDiscussion(id: string): Promise<Discussion> {
    return this._get<Discussion>(`discussions/${id}`);
  }

  // private methods
  // --------------------------------------------
  async _deleteExternalLink(type: "user"|"idea", id: string, externalLink: ExternalLink): Promise<void> {
    return this._patch(`/${type}s/${id}`, {removeExternalLink: externalLink});
  }

  async _addExternalLink(type: "user"|"idea", id: string, externalLink: ExternalLink): Promise<void> {
    return this._patch(`/${type}s/${id}`, {addExternalLink: externalLink});
  }

  private async _head(path: string): Promise<boolean> {
    let response;
    try {
      response = await lastValueFrom(this.db.head(`${this.basePath}/${path}`));
      return true;
    } catch(err) {
      if (err instanceof HttpErrorResponse) {
        if (err.status === 404) { return false; }
      }
      throw err;
    }
  }

  private async _get<T>(path: string): Promise<T> {
    let data = await lastValueFrom(this.db.get<T>(`${this.basePath}/${path}`));
    this._convertApiDataToData(data);
    return data;
  }

  private async _post(path: string, body: object): Promise<string> {
    const response = await lastValueFrom(this.db.post<PostResponse>(`${this.basePath}/${path}`, body));
    return response.insertedId;
  }

  private async _delete(path: string): Promise<void> {
    return lastValueFrom(this.db.delete<void>(`${this.basePath}/${path}`));
  }

  private async _put(path: string, body: object): Promise<void> {
    await lastValueFrom(this.db.put(`${this.basePath}/${path}`, body));
  }

  private async _patch(path: string, body: object): Promise<void> {
    return lastValueFrom(this.db.patch<void>(`${this.basePath}/${path}`, body));
  }

  private _convertApiDataToData(apiData: any): any {
    if (Array.isArray(apiData)) {
      apiData.forEach(apiDoc => this._convertApiDocToDoc(apiDoc));
    } else {
      this._convertApiDocToDoc(apiData);
    }
  }

  private _convertApiDocToDoc(apiDoc: any) {
    for (let [key, value] of Object.entries(apiDoc)) {
      if (key == "date" || key.endsWith("Date")) {
        apiDoc[key] = new Date(value as any);
      }
      if (value instanceof Object) {
        this._convertApiDocToDoc(value);
      }
    }
  }

}
