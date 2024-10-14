import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Change, Discussion, Notification, User, isChange } from 'sonddr-shared';
import { BehaviorSubject, Subscription } from 'rxjs';
import { SseService } from './sse.service';
import { HttpService } from './http.service';
import { KeycloakProfile } from 'keycloak-js';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { MainNavService } from './main-nav.service';

@Injectable({
  providedIn: 'root'
})
export class UserDataService {

  // dependencies
  // --------------------------------------------
  sse = inject(SseService);
  auth = inject(AuthService);
  http = inject(HttpService);
  router = inject(Router);
  mainNav = inject(MainNavService);

  // attributes
  // --------------------------------------------
  user$ = new BehaviorSubject<User|undefined>(undefined);
  discussionsSub?: Subscription;
  notificationsSub?: Subscription;
  oldNotifications: Notification[] = [];
  newNotifications: Notification[] = [];
  olderDiscussions: Discussion[] = [];
  activeDiscussions: Discussion[] = [];

  // lifecycle hooks
  // --------------------------------------------
  constructor() {
    this.auth.profile$.subscribe(user => this._onProfileUpdate(user));
  }

  // public methods
  // --------------------------------------------
  async refreshUser() {
    const newUser = await this.http.getUser(this._getUser()!.id);
    this.user$.next(newUser);
  }

  goToProfileOrAuth() {
    if (!this.auth.isLoggedIn()) {
      this.auth.logIn();
      return;
    }
    if (!this.user$) { throw new Error("User is undefined"); }
    this.mainNav.navigateTo(`/ideas/user/${this._getUser()!.id}`, true);
  }

  // private
  // --------------------------------------------
  _getUser(): User|undefined {
    return this.user$.getValue();
  }

  async _onProfileUpdate(profile: KeycloakProfile | undefined) {
    if (!profile) {
      // nobody is logged in
      this._reset();
    } else if (!this._isSameUser(profile)) {
      // login user changed
      this._reset();
      this.user$.next(await this._fetchOrCreateUser(profile));
      this.discussionsSub = (await this.sse.getDiscussions()).subscribe(
        data => this._onDiscussionsUpdate(data)
      );
      this.notificationsSub = (await this.sse.getNotifications()).subscribe(
        data => this._onNotificationsUpdate(data)
      );
    }
  }

  _isSameUser(profile: KeycloakProfile): boolean {
    return (this._getUser()?.id === profile.id);
  }

  _reset() {
    this.discussionsSub?.unsubscribe();
    this.notificationsSub?.unsubscribe();
    this.newNotifications = [];
    this.newNotifications = [];
    this.olderDiscussions = [];
    this.activeDiscussions = [];
    this.user$.next(undefined);
  }

  async _fetchOrCreateUser(profile: KeycloakProfile): Promise<User> {
    const id = profile.id;
    if (id === undefined) { throw new Error("id missing from keycloak profile"); }
    let user: User;
    try {
      user = await this.http.getUser(id);
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 404) {
        const name = this._choose_name(profile);
        await this.http.createUser(id, name);
        user = await this.http.getUser(id);
        setTimeout(() => {
          this.mainNav.navigateTo(`/ideas/user-edit/${user.id}?welcome=true`, true)
        }, 100);
      } else {
        throw err;
      }
    }
    return user;
  }

  _onDiscussionsUpdate(data: Discussion[] | Change<Discussion>) {
    if (isChange(data)) {
      const change = data as Change<Discussion>;
      switch (change.type) {
        case "insert": {
          const ref = change.docAfter!.readByIds.includes(this._getUser()!.id)
            ? this.olderDiscussions
            : this.activeDiscussions;
          ref.unshift(change.docAfter!);
          break;
        }
        case "delete": {
          const [ref, index] = this._findDiscussion(change.docId);
          ref.splice(index, 1);
          break;
        }
        case "update": {
          const [sourceRef, index] = this._findDiscussion(change.docId);
          sourceRef.splice(index, 1);
          const targetRef = change.docAfter!.readByIds.includes(this._getUser()!.id)
            ? this.olderDiscussions
            : this.activeDiscussions;
          targetRef.unshift(change.docAfter!);
          break;
        }
      }
    } else {
      const discussions = data as Discussion[];
      this.olderDiscussions = discussions.filter(d => d.readByIds.includes(this._getUser()!.id));
      this.activeDiscussions = discussions.filter(d => !d.readByIds.includes(this._getUser()!.id));
    }
  }

  _onNotificationsUpdate(data: Notification[] | Change<Notification>) {
    if (isChange(data)) {
      const change = data as Change<Notification>;
      switch (change.type) {
        case "insert": {
          const ref = change.docAfter!.readByIds.includes(this._getUser()!.id)
            ? this.oldNotifications
            : this.newNotifications;
          ref.unshift(change.docAfter!);
          break;
        }
        case "delete": {
          const [ref, index] = this._findNotification(change.docId);
          ref.splice(index, 1);
          break;
        }
        case "update": {
          const [sourceRef, index] = this._findNotification(change.docId);
          sourceRef.splice(index, 1);
          const targetRef = change.docAfter!.readByIds.includes(this._getUser()!.id)
            ? this.oldNotifications
            : this.newNotifications;
          targetRef.unshift(change.docAfter!);
          break;
        }
      }
    } else {
      const notifications = data as Notification[];
      this.oldNotifications = notifications.filter(n => n.readByIds.includes(this._getUser()!.id));
      this.newNotifications = notifications.filter(n => !n.readByIds.includes(this._getUser()!.id));
    }
  }

  _findNotification(id: string): [Notification[], number] {
    let index: number;
    index = this.oldNotifications.findIndex(d => d.id === id);
    if (index !== -1) { return [this.oldNotifications, index]; }
    index = this.newNotifications.findIndex(d => d.id === id);
    if (index !== -1) { return [this.newNotifications, index]; }
    throw new Error(`Failed to find notification ${id}`);
  }

  _findDiscussion(id: string): [Discussion[], number] {
    let index: number;
    index = this.olderDiscussions.findIndex(d => d.id === id);
    if (index !== -1) { return [this.olderDiscussions, index]; }
    index = this.activeDiscussions.findIndex(d => d.id === id);
    if (index !== -1) { return [this.activeDiscussions, index]; }
    throw new Error(`Failed to find discussion ${id}`);
  }

  _choose_name(profile: KeycloakProfile): string {
    const firstName = profile.firstName;
    const lastName = profile.lastName;
    const name = (firstName && lastName) ? `${firstName} ${lastName}` : profile.username;
    if (!name) {
      throw new Error(`Failed to choose username for ${profile.id}`);
    }
    return name;
  }

}
