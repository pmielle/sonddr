import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { User } from 'sonddr-shared';
import { HttpService } from 'src/app/services/http.service';
import { ScreenSizeService } from 'src/app/services/screen-size.service';
import { MainNavService } from 'src/app/services/main-nav.service';
import { UserDataService } from 'src/app/services/user-data.service';

@Component({
  selector: 'app-new-discussion',
  templateUrl: './new-discussion.component.html',
  styleUrls: ['./new-discussion.component.scss']
})
export class NewDiscussionComponent implements OnInit, OnDestroy {

  // dependencies
  // --------------------------------------------
  userData = inject(UserDataService);
  screen = inject(ScreenSizeService);
  route = inject(ActivatedRoute);
  http = inject(HttpService);
  router = inject(Router);
  mainNav = inject(MainNavService);

  // attributes
  // --------------------------------------------
  routeSub?: Subscription;
  selectedUser?: User;
  searchString = "";
  searchResults?: User[];
  content = "";
  inFocus = false;
  smallButton = false;

  // lifecycle hooks
  // --------------------------------------------
  ngOnInit(): void {
    this.mainNav.flattenNavBar();
    this.routeSub = this.route.queryParamMap.subscribe(async map => {
      const id = map.get("preselected");
      if (id) {
        const user = await this.http.getUser(id);
        this.selectedUser = user;
      }
    });
    this.mainNav.disableFullScreenOnScroll();
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe;
  }

  // methods
  // --------------------------------------------
  onInputFocus() {
    this.inFocus = true;
  }

  onInputBlur() {
    this.inFocus = false;
  }

  formIsValid(): boolean {
    return (this.selectedUser && this.content.length) ? true : false;
  }

  async submit() {
    if (!this.formIsValid()) {
      throw new Error("submit() should not be callable when form is not valid");
    }
    const insertedId = await this.http.createNewDiscussion(this.selectedUser!.id, this.content);
    this.mainNav.navigateTo(`/messages/discussion/${insertedId}`, true, {replaceUrl: true});
  }

  selectUser(user: User) {
    this.selectedUser = user;
    this.searchResults = undefined;
    this.searchString = "";
  }

  clearUser() {
    this.selectedUser = undefined;
    this.searchResults = undefined;
    this.searchString = "";
  }

  onInputKeyup(e: KeyboardEvent) {
    if (e.code === "Enter") {
      this.search();
    // search if at least 3 characters
    // or if a search has been forced already using 'Enter'
    } else if (this.searchString.length > 2 || this.searchResults?.length) {
      this.search();
    } else {
      this.clearSearch();
    }
  }

  async search() {
    if (!this.searchString) {
      this.clearSearch();
      return;
    }
    this.searchResults = await this.http.searchUsers(this.searchString);
  }

  clearSearch() {
    this.searchResults = undefined;
  }

}
