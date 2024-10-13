import { Component, ViewChild, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { User, Idea, ExternalLink } from 'sonddr-shared';
import { IdeaListComponent, SortBy } from 'src/app/components/idea-list/idea-list.component';
import { HttpService } from 'src/app/services/http.service';
import { ScreenSizeService } from 'src/app/services/screen-size.service';
import { TimeService } from 'src/app/services/time.service';
import { MainNavService } from 'src/app/services/main-nav.service';
import { UserDataService } from 'src/app/services/user-data.service';
import { AuthService } from 'src/app/services/auth.service';
import { TranslationService } from 'src/app/services/translation.service';

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
  auth = inject(AuthService);
  i18n = inject(TranslationService);

  // i/o
  // --------------------------------------------
  // ...

  // attributes
  // --------------------------------------------
  @ViewChild(IdeaListComponent) ideaList?: IdeaListComponent;
  user?: User;
  ideas?: Idea[];
  routeSub?: Subscription;

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
          // depending on who the user is
          if (u) {
            if (u.isUser) {
              this.mainNav.hideNavBar();
              this.mainNav.setFab({
                icon: "logout",
                color: "var(--red)",
                label: this.i18n.get("fab.log-out"),
                action: () => this.auth.logOut(),
              });
            } else {
              this.mainNav.showNavBar();
              this.mainNav.setFab({
                icon: "add",
                color: "var(--blue)",
                label: this.i18n.get("fab.send-a-message"),
                action: () => this.mainNav.navigateTo(`/messages/new-discussion?preselected=${u.id}`, true),
              });
            }
          } else {
            this.mainNav.showNavBar();
            this.mainNav.setFab(undefined);
          }

          // set user
          this.user = u

          // because the height of the bio component is not fixed,
          // the fullscreen has to be triggered later down the scroll
          setTimeout(() => {
            const newTopValue = (this.ideaList?.elementRef.nativeElement as Element).getBoundingClientRect();
            this.mainNav.topValue = newTopValue.top;
          }, 0);

        });

      }
    );

  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  // methods
  // --------------------------------------------
  chooseCover() {
    const gradient = 'var(--cover-gradient)';
    return this.user?.cover ? `${gradient}, url(${this.http.getImageUrl(this.user.cover)}` : gradient;
  }

  onEditClick() {
    this.mainNav.navigateTo(
      `/ideas/user-edit/${this.user!.id}`,
      true,
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
