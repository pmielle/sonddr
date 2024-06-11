import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { HttpService } from 'src/app/services/http.service';
import { ScreenSizeService } from 'src/app/services/screen-size.service';
import { UserDataService } from 'src/app/services/user-data.service';
import { Notification } from "sonddr-shared";

@Component({
  selector: 'app-notifications-view',
  templateUrl: './notifications-view.component.html',
  styleUrls: ['./notifications-view.component.scss']
})
export class NotificationsViewComponent implements OnInit, OnDestroy {

  // dependencies
  // --------------------------------------------
  screen = inject(ScreenSizeService);
  userData = inject(UserDataService);
  http = inject(HttpService);

  // attributes
  // --------------------------------------------
  showOlder = false;

  // lifecycle hooks
  // --------------------------------------------
  ngOnInit() {
  }

  ngOnDestroy(): void {
  }

  // methods
  // --------------------------------------------
  openNotification(notification: Notification, markAsRead: boolean = false) {
    if (markAsRead) {
      this.http.markNotificationAsRead(notification.id);
    }
    // TODO: actually go somewhere here
  }

}
