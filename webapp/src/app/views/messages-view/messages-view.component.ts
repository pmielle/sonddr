import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Discussion } from 'sonddr-shared/dist';
import { HttpService } from 'src/app/services/http.service';
import { MainNavService } from 'src/app/services/main-nav.service';
import { ScreenSizeService } from 'src/app/services/screen-size.service';
import { TranslationService } from 'src/app/services/translation.service';
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
  mainNav = inject(MainNavService);
  i18n = inject(TranslationService);

  // i/o
  // --------------------------------------------
  // ...

  // attributes
  // --------------------------------------------
  // ...

  // lifecycle hooks
  // --------------------------------------------
  ngOnInit() {
    this.mainNav.setFab({
      icon: "add",
      color: "var(--blue)",
      label: this.i18n.get("fab.start-a-discussion"),
      action: () => {this.router.navigateByUrl(`/messages/new-discussion`)}
    });
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
