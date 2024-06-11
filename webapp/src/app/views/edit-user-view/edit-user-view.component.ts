import { Component, ViewChild, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, combineLatest, map, switchMap } from 'rxjs';
import { User } from 'sonddr-shared';
import { HttpService } from 'src/app/services/http.service';
import { MainNavService } from 'src/app/services/main-nav.service';
import { ScreenSizeService } from 'src/app/services/screen-size.service';
import { EditorComponent } from 'src/app/components/editor/editor.component';
import { UserDataService } from 'src/app/services/user-data.service';

@Component({
  selector: 'app-edit-user-view',
  templateUrl: './edit-user-view.component.html',
  styleUrl: './edit-user-view.component.scss'
})
export class EditUserViewComponent {

  // dependencies
  // --------------------------------------------
  route = inject(ActivatedRoute);
  http = inject(HttpService);
  screen = inject(ScreenSizeService);
  userData = inject(UserDataService);
  mainNav = inject(MainNavService);
  router = inject(Router);

  // attributes
  // --------------------------------------------
  mainSub?: Subscription;
  fabSub?: Subscription;
  coverPreview?: string;
  profilePicturePreview?: string;
  name = "";
  cover?: File;
  profilePicture?: File;
  initialName?: string;
  initialBio?: string;
  user?: User;
  welcome = false;
  @ViewChild(EditorComponent) editor!: EditorComponent;

  // lifecycle hooks
  // --------------------------------------------
  ngOnInit(): void {

    // get data
    this.mainSub = combineLatest([
      this.route.queryParamMap.pipe(
        map(map => map.get("welcome")),
      ),
      this.route.paramMap.pipe(
        switchMap(params => {
          const userId = params.get("id");
          if (userId) {
            return this.http.getUser(userId);
          } else {
            throw new Error("Missing id parameter");
          }
        })
      ),
    ]).subscribe(([welcome, u]) => {
      this.welcome = welcome === "true";
      if (u.isUser) {
        this.user = u;
        this.setupEdit(u);
      } else {
        throw new Error("Unauthorized");
      }
    });

    // hide bottom bar and disable fab
    setTimeout(() => {
      this.mainNav.hideNavBar();
      this.mainNav.disableFab();
    }, 100); // otherwise NG0100

    // listen to fab clicks
    this.fabSub = this.mainNav.fabClick.subscribe(() => {
        this.submit();
    });
  }

  ngOnDestroy(): void {

    // unsubscribe
    this.mainSub?.unsubscribe();
    this.fabSub?.unsubscribe();

    // restore nav bar and fab
    this.mainNav.showNavBar();
    this.mainNav.restoreFab();
  }

  // methods
  // --------------------------------------------
  chooseCover() {
    const gradient = 'var(--cover-gradient)';
    return this.coverPreview ? `${gradient}, url(${this.coverPreview})` : gradient;
  }

  setupEdit(user: User) {
    this.name = user.name;
    this.editor.setContent(user.bio);
    this.initialBio = user.bio;
    this.initialName = user.name;
    if (user.cover) { this.coverPreview = this.http.getImageUrl(user.cover); }
    if (user.profilePicture) { this.profilePicturePreview = this.http.getImageUrl(user.profilePicture); }
    this.refreshFabDisplay();
  }

  onNameTab(e: Event) {
    e.preventDefault();
    this.editor.contentDiv?.nativeElement.focus();
  }

  onInputFocus() {
    this.mainNav.hideFab();
  }

  onInputBlur() {
    this.mainNav.showFab();
  }

  formIsValid(): boolean {
    return (this.name) ? true : false;
  }

  async submit(): Promise<void> {
    if (! this.formIsValid() || ! this.somethingHasBeenEdited()) {
      throw new Error("submit should not be callable if one input is empty or if nothing has changed");
    }
    await this.http.editUser(
      this.user!.id,
      this.nameHasChanged() ? this.name : undefined,
      this.bioHasChanged() ? this.editor.content : undefined,
      this.cover,
      this.profilePicture,
    );
    setTimeout(() => {
      this.userData.refreshUser();
      this.router.navigateByUrl(
        this.welcome ? `/` : `/ideas/user/${this.user!.id}`,
        { skipLocationChange: this.welcome ? false : true }
      );
    }, 100); // otherwise doesn't refresh for some reason
  }

  onProfilePictureChange(file: File) {
    this.profilePicture = file;
    this.profilePicturePreview = URL.createObjectURL(file);
    this.refreshFabDisplay();
  }

  onCoverChange(file: File) {
    this.cover = file;
    this.coverPreview = URL.createObjectURL(file);
    this.refreshFabDisplay();
  }

  refreshFabDisplay() {
    if (this.formIsValid() && this.somethingHasBeenEdited()) {
      this.mainNav.enableFab();
    } else {
      this.mainNav.disableFab();
    }
  }

  somethingHasBeenEdited(): boolean {
    return this.coverHasChanged() || this.profilePictureHasChanged() || this.nameHasChanged() || this.bioHasChanged();
  }

  nameHasChanged(): boolean {
    return this.name !== this.initialName;
  }

  bioHasChanged(): boolean {
    return this.editor.content !== this.initialBio;
  }

  coverHasChanged(): boolean {
    return this.cover !== undefined;
  }

  profilePictureHasChanged(): boolean {
    return this.profilePicture !== undefined;
  }

}
