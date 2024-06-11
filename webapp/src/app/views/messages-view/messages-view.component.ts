import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Discussion } from 'sonddr-shared/dist';
import { HttpService } from 'src/app/services/http.service';
import { ScreenSizeService } from 'src/app/services/screen-size.service';
import { UserDataService } from 'src/app/services/user-data.service';

@Component({
  selector: 'app-messages-view',
  templateUrl: './messages-view.component.html',
  styleUrls: ['./messages-view.component.scss']
})
export class MessagesViewComponent implements OnInit, OnDestroy {

  // dependencies
  // --------------------------------------------
  screen = inject(ScreenSizeService);
  userData = inject(UserDataService);
  router = inject(Router);
  http = inject(HttpService);

  // attributes
  // --------------------------------------------
  // ...

  // lifecycle hooks
  // --------------------------------------------
  ngOnInit() {
  }

  ngOnDestroy(): void {
  }

  // methods
  // --------------------------------------------
  goToDiscussion(discussion: Discussion, markAsRead: boolean = false) {
    if (markAsRead) { this.http.markDiscussionAsRead(discussion.id); }
    this.router.navigateByUrl(`/messages/discussion/${discussion.id}`);
  }

}
