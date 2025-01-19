import { Injectable, inject } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { HttpService } from './http.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  swPush = inject(SwPush);
  http = inject(HttpService);
  browserId = this._getBrowserId();

  constructor() { }

  _getBrowserId(): string {
    const key = "browserId";
    let browserId = localStorage.getItem(key);
    if (browserId) {
      return browserId;
    } else {
      let browserId = crypto.randomUUID();
      localStorage.setItem(key, browserId);
      return browserId;
    }
  }

  async start() {
    if (! this._isSupported()) {
      console.log("web-push is not enabled for this browser");
      return;
    }
    if (! await this._isActive()) {
      await this._requestSubscription()
        .then(sub => this.http.registerSubscription(this.browserId, sub));
    } else {
      await this.http.updateSubscriptionUser(this.browserId);
    }
  }

  async stop() {
    if (! this._isSupported()) {
      console.log("web-push is not enabled for this browser");
      return;
    }
    if (! await this._isActive()) {
      console.log("web-push is not active");
      return;
    }
    this.http.deleteSubscriptionUser(this.browserId);
  }

  // private
  // --------------------------------------------
  async _isActive(): Promise<boolean> {
    // sw = service worker (notif enabled in the browser)
    // db = database (notif endpoint exists in database)
    let swPush = await firstValueFrom(this.swPush.subscription);
    if (! swPush) { return false; }
    let dbPush = await this.http.checkSubcription(this.browserId);
    if (dbPush) { return true; }
    // edge case: sw ok but nothing in db (should not happen)
    // in this case, get the url from sw and save it in db
    await this._requestSubscription()
      .then(sub => this.http.registerSubscription(this.browserId, sub));
    return true;
  }

  async _requestSubscription(): Promise<PushSubscription> {
    const vapidPublicKey = await this.http.getVapidPublicKey();
    let res = await this.swPush.requestSubscription({
      serverPublicKey: vapidPublicKey,
    });
    return res;
  }

  _isSupported(): boolean {
    return this.swPush.isEnabled;
  }

}
