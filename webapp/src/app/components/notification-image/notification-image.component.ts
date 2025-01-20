import { Component, Input, inject } from '@angular/core';
import { Notification } from 'sonddr-shared';
import { HttpService } from 'src/app/services/http.service';

@Component({
  selector: 'app-notification-image',
  templateUrl: './notification-image.component.html',
  styleUrl: './notification-image.component.scss'
})
export class NotificationImageComponent {

  http = inject(HttpService);

  @Input('notification') notification?: Notification;

  chooseBackgroundImage() {
    let url = this.notification?.picture
      ? this.http.getImageUrl(this.notification.picture)
      : 'assets/empty-profile-picture.png';
      return `url(${url})`;
  }

}
