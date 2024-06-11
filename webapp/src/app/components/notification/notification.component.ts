import { Component, Input, inject } from '@angular/core';
import { Notification } from 'sonddr-shared';
import { TimeService } from 'src/app/services/time.service';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent {

  // dependencies
  // --------------------------------------------
  time = inject(TimeService);

  // I/O
  // --------------------------------------------
  @Input("notification") notification?: Notification;

}
