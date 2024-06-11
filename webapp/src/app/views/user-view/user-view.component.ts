import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { User, Idea, ExternalLink } from 'sonddr-shared';
import { SortBy } from 'src/app/components/idea-list/idea-list.component';
import { HttpService } from 'src/app/services/http.service';
import { ScreenSizeService } from 'src/app/services/screen-size.service';
import { TimeService } from 'src/app/services/time.service';
import { MainNavService } from 'src/app/services/main-nav.service';
import { UserDataService } from 'src/app/services/user-data.service';

@Component({
  selector: 'app-user-view',
  templateUrl: './user-view.component.html',
  styleUrls: ['./user-view.component.scss']
})
export class UserViewComponent {

  // dependencies
  // --------------------------------------------
  route = inject(ActivatedRoute);
  http = inject(HttpService);
  screen = inject(ScreenSizeService);
  userData = inject(UserDataService);
  time = inject(TimeService);
  mainNav = inject(MainNavService);
  router = inject(Router);

  // attributes
  // --------------------------------------------
  routeSub?: Subscription;
  user?: User;
  ideas?: Idea[];

  // lifecycle hooks
  // --------------------------------------------
  ngOnInit(): void {
    // get user data
    this.routeSub = this.route.paramMap.subscribe(
      (map) => {
        const id = map.get("id")!;
        this.http.getIdeas("recent", undefined, id).then(i => this.ideas = i);
        this.http.getUser(id).then(u => {

          // manage fab and bottom bar
          if (u) {
            if (u.isUser) {
              this.mainNav.setLoggedInUserFab();
              this.mainNav.hideNavBar();
            } else {
              this.mainNav.setOtherUserFab(u.id);
              this.mainNav.showNavBar();
            }
          } else {
            this.mainNav.setUndefinedFab();
            this.mainNav.showNavBar();
          }

          // set user
          this.user = u
        });

      }
    );

  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.mainNav.showNavBar();
  }

  // methods
  // --------------------------------------------
  chooseCover() {
    const gradient = 'var(--cover-gradient)';
    return this.user?.cover ? `${gradient}, url(${this.http.getImageUrl(this.user.cover)}` : gradient;
  }

  async onEditClick() {
    this.router.navigateByUrl(
      `/ideas/user-edit/${this.user!.id}`,
      {skipLocationChange: true}
    );
  }

  addExternalLink(link: ExternalLink) {
    this.user!.externalLinks.push(link);
    this.http.addUserExternalLink(this.user!.id, link);
  }

  deleteExternalLink(link: ExternalLink) {
    this.user!.externalLinks = this.user!.externalLinks.filter(el => el.type !== link.type);
    this.http.deleteUserExternalLink(this.user!.id, link);
  }

  onSortByChange(sortBy: SortBy) {
    if (!this.user) {
      throw new Error("this.user should be defined at this point");
    }
    this.http.getIdeas(sortBy, undefined, this.user.id).then(i => this.ideas = i);
  }

}
