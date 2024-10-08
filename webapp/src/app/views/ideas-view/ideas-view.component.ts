import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Goal, Idea } from 'sonddr-shared';
import { SortBy } from 'src/app/components/idea-list/idea-list.component';
import { HttpService } from 'src/app/services/http.service';
import { MainNavService } from 'src/app/services/main-nav.service';
import { ScreenSizeService } from 'src/app/services/screen-size.service';
import { TranslationService } from 'src/app/services/translation.service';
import { UserDataService } from 'src/app/services/user-data.service';

@Component({
  selector: 'app-ideas-view',
  templateUrl: './ideas-view.component.html',
  styleUrls: ['./ideas-view.component.scss']
})
export class IdeasViewComponent implements OnInit {

  // dependencies
  // --------------------------------------------
  http = inject(HttpService);
  screen = inject(ScreenSizeService);
  userData = inject(UserDataService);
  mainNav = inject(MainNavService);
  i18n = inject(TranslationService);
  router = inject(Router);

  // i/o
  // --------------------------------------------
  // ...

  // attributes
  // --------------------------------------------
  goals?: Goal[];
  ideas?: Idea[];

  // lifecycle hooks
  // --------------------------------------------
  ngOnInit() {
    this.http.getGoals().then(g => this.goals = g);
    this.http.getIdeas("recent").then(i => this.ideas = i);
    this.mainNav.setFab({
        icon: "add",
        color: "var(--primary-color)",
        label: this.i18n.get("fab.share-an-idea"),
        action: () => {this.router.navigateByUrl("/ideas/add")}
    });
  }

  // methods
  // --------------------------------------------
  onSortByChange(sortBy: SortBy) {
    this.mainNav.scrollToTop(true);
    this.http.getIdeas(sortBy).then(i => this.ideas = i);
  }

}
