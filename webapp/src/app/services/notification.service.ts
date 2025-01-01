import { Injectable, inject } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { HttpService } from './http.service';

const storageKey = 'push';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  swPush = inject(SwPush);
  http = inject(HttpService);

  constructor() { }

  async start() {
    if (this._isEnabled()) {
      console.log("swPush is already enabled");
      return;
    }
    this._requestSubscription()
      .then(url => this.http.registerSubscription(url))
      .then(id => {
        localStorage.setItem(storageKey, id)
      });
  }

  async stop() {
    if (!this._isEnabled()) { throw new Error("swPush is not enabled"); }
    const id = localStorage.getItem(storageKey);
    if (!id) {
      throw new Error(`'${storageKey}' is not defined in localStorage`);
    }
    this.http.deleteSubscription(id)
      .then(() => localStorage.removeItem(storageKey));
  }

  // private
  // --------------------------------------------
  async _requestSubscription(): Promise<PushSubscription> {
    const vapidPublicKey = await this.http.getVapidPublicKey();
    let res = await this.swPush.requestSubscription({
      serverPublicKey: vapidPublicKey,
    });
    return res;
  }

  _isEnabled(): boolean {
    console.log(JSON.stringify(this.swPush.isEnabled));
    return this.swPush.isEnabled;
  }

}
