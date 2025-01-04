import { Injectable, inject } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { HttpService } from './http.service';
import { firstValueFrom } from 'rxjs';

const storageKey = 'push';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  swPush = inject(SwPush);
  http = inject(HttpService);

  constructor() { }

  async start() {
    if (! this._isEnabled()) {
      console.log("web-push is not enabled for this browser");
      return;
    }
    if (await this._isActive()) {
      console.log("web-push is already active");
      return;
    }
    this._requestSubscription()
      .then(url => this.http.registerSubscription(url))
      .then(id => {
        localStorage.setItem(storageKey, id)
      });
  }

  async stop() {
    if (! this._isEnabled()) {
      console.log("web-push is not enabled for this browser");
      return;
    }
    if (! await this._isActive()) {
      throw new Error("web-push is not active");
    }
    const id = localStorage.getItem(storageKey);
    if (!id) {
      throw new Error(`'${storageKey}' is not defined in localStorage`);
    }
    this.http.deleteSubscription(id)
      .then(() => localStorage.removeItem(storageKey));
  }

  // private
  // --------------------------------------------
  async _isActive(): Promise<boolean> {
    return firstValueFrom(this.swPush.subscription)
      .then(sub => sub ? true : false);
  }

  async _requestSubscription(): Promise<PushSubscription> {
    const vapidPublicKey = await this.http.getVapidPublicKey();
    let res = await this.swPush.requestSubscription({
      serverPublicKey: vapidPublicKey,
    });
    return res;
  }

  _isEnabled(): boolean {
    return this.swPush.isEnabled;
  }

}
