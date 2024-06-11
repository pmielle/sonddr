import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { Goal, Idea } from 'sonddr-shared';
import { SortBy } from 'src/app/components/idea-list/idea-list.component';
import { HttpService } from 'src/app/services/http.service';
import { ColorService } from 'src/app/services/color.service';
import { ScreenSizeService } from 'src/app/services/screen-size.service';
import { UserDataService } from 'src/app/services/user-data.service';

@Component({
  selector: 'app-goal-view',
  templateUrl: './goal-view.component.html',
  styleUrls: ['./goal-view.component.scss']
})
export class GoalViewComponent implements OnInit, OnDestroy {

  // dependencies
  // --------------------------------------------
  route = inject(ActivatedRoute);
  http = inject(HttpService);
  screen = inject(ScreenSizeService);
  color = inject(ColorService);
  userData = inject(UserDataService);

  // attributes
  // --------------------------------------------
  routeSub?: Subscription;
  ideas?: Idea[];
  goal?: Goal;
  otherGoals?: Goal[];

  // lifecycle hooks
  // --------------------------------------------
  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe((map) => {
      const id = map.get("id")!;
      this.http.getGoal(id).then(g => this.goal = g);
      this.http.getGoals().then(goals => {
        let otherGoals: Goal[] = [];
        let goal: Goal|undefined = undefined;
        goals.forEach(g => {
          if (g.id == id) { goal = g }
          else { otherGoals.push(g) }
        });
        this.otherGoals = otherGoals;
        this.goal = goal;
      });
      this.http.getIdeas("recent", id, undefined).then(i => this.ideas = i);
    })
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  // methods
  // --------------------------------------------
  onSortByChange(sortBy: SortBy) {
    if (!this.goal) {
      throw new Error("this.goal should be defined at this point");
    }
    this.http.getIdeas(sortBy, this.goal.id, undefined).then(i => this.ideas = i);
  }

  makeBackgroundColor(): string {
    return this.goal
      ? this.color.shadeColor(this.goal.color, -33)
      : '#303030'
  }

}
