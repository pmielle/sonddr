import { Component, OnInit, inject } from '@angular/core';
import { Goal, Idea } from 'sonddr-shared';
import { SortBy } from 'src/app/components/idea-list/idea-list.component';
import { HttpService } from 'src/app/services/http.service';
import { ScreenSizeService } from 'src/app/services/screen-size.service';
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


  // attributes
  // --------------------------------------------
  goals?: Goal[];
  ideas?: Idea[];


  // lifecycle hooks
  // --------------------------------------------
  ngOnInit() {
    this.http.getGoals().then(g => this.goals = g);
    this.http.getIdeas("recent").then(i => this.ideas = i);
  }

  // methods
  // --------------------------------------------
  onSortByChange(sortBy: SortBy) {
    this.http.getIdeas(sortBy).then(i => this.ideas = i);
  }

}
