import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Goal, Idea } from 'sonddr-shared';
import { SortBy } from 'src/app/components/idea-list/idea-list.component';
import { HttpService } from 'src/app/services/http.service';
import { ColorService } from 'src/app/services/color.service';
import { ScreenSizeService } from 'src/app/services/screen-size.service';
import { UserDataService } from 'src/app/services/user-data.service';
import { TranslationService } from 'src/app/services/translation.service';
import { MainNavService } from 'src/app/services/main-nav.service';
import { AuthService } from 'src/app/services/auth.service';

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
  i18n = inject(TranslationService);
  mainNav = inject(MainNavService);
  router = inject(Router);
  auth = inject(AuthService);

  // i/o
  // --------------------------------------------
  // ...

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
      // set fab
      this.mainNav.setFab({
        icon: "add",
        color: "var(--primary-color)",
        label: this.i18n.get("fab.share-an-idea"),
        action: () => this.mainNav.navigateTo(`/ideas/add?preselected=${id}`, true),
      });
      // get goal and its ideas
      this.http.getGoals().then(goals => this.dispatchGoals(goals, id));
      this.http.getIdeas("recent", id, undefined).then(i => this.ideas = i);
    })
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  // methods
  // --------------------------------------------
  dispatchGoals(goals: Goal[], goalId: string) {
    let otherGoals: Goal[] = [];
    let goal: Goal|undefined = undefined;
    goals.forEach(g => {
      if (g.id == goalId) { goal = g }
      else { otherGoals.push(g) }
    });
    this.otherGoals = otherGoals;
    this.goal = goal;
    // update status bar color
    let color = this.color.shadeColor(goal!.color, -33);
    this.mainNav.updateStatusBarColor(color);
  }

  onSortByChange(sortBy: SortBy) {
    if (!this.goal) {
      throw new Error("this.goal should be defined at this point");
    }
    this.mainNav.scrollToTop(true);
    this.http.getIdeas(sortBy, this.goal.id, undefined).then(i => this.ideas = i);
  }

  makeBackgroundColor(): string {
    return this.goal
      ? this.color.shadeColor(this.goal.color, -33)
      : '#303030'
  }

}
