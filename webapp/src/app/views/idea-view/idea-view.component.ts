import { Component, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Comment, ExternalLink, Idea, placeholder_id } from 'sonddr-shared';
import { SortBy } from 'src/app/components/idea-list/idea-list.component';
import { HttpService } from 'src/app/services/http.service';
import { MainNavService } from 'src/app/services/main-nav.service';
import { ScreenSizeService } from 'src/app/services/screen-size.service';
import { TimeService } from 'src/app/services/time.service';
import { MatDialog } from '@angular/material/dialog';
import { UserDataService } from 'src/app/services/user-data.service';

@Component({
  selector: 'app-idea-view',
  templateUrl: './idea-view.component.html',
  styleUrls: ['./idea-view.component.scss']
})
export class IdeaViewComponent implements OnDestroy {

  // dependencies
  // --------------------------------------------
  route = inject(ActivatedRoute);
  http = inject(HttpService);
  time = inject(TimeService);
  screen = inject(ScreenSizeService);
  mainNav = inject(MainNavService);
  userData = inject(UserDataService);
  router = inject(Router);
  dialog = inject(MatDialog);

  // attributes
  // --------------------------------------------
  routeSub?: Subscription;
  fabClickSub?: Subscription;
  popupSub?: Subscription;
  idea?: Idea;
  comments?: Comment[];

  // lifecycle hooks
  // --------------------------------------------
  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe(map => {
      const id = map.get("id");
      if (!id) { throw new Error("id not found in url params"); }
      this.http.getIdea(id).then(i => {
        this.idea = i;
        this.setHasCheered(i.userHasCheered, true);
      });
      this.http.getComments("recent", id, undefined).then(c => this.comments = c);
    });
    this.fabClickSub = this.mainNav.fabClick.subscribe(() => this.toggleCheer());
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.fabClickSub?.unsubscribe();
    this.popupSub?.unsubscribe();
    this.mainNav.showNavBar();
    this.mainNav.showFab();
  }

  // methods
  // --------------------------------------------
  onInputFocus() {
    this.mainNav.hideFab();
  }

  onInputBlur() {
    this.mainNav.showFab();
  }

  deleteExternalLink(link: ExternalLink) {
    this.idea!.externalLinks = this.idea!.externalLinks.filter(el => el.type !== link.type);
    this.http.deleteIdeaExternalLink(this.idea!.id, link);
  }

  addExternalLink(link: ExternalLink) {
    this.idea!.externalLinks.push(link);
    this.http.addIdeaExternalLink(this.idea!.id, link);
  }

  async onDeleteClick() {
    await this.http.deleteIdea(this.idea!.id);
    this.router.navigateByUrl("/ideas");
  }

  async onEditClick() {
    this.router.navigateByUrl(
      `/ideas/add?edit=${this.idea!.id}`,
      {skipLocationChange: true}
    );
  }

  chooseCover() {
    const gradient = 'var(--cover-gradient)';
    return this.idea?.cover ? `${gradient}, url(${this.http.getImageUrl(this.idea.cover)}` : gradient;
  }

  upvoteComment(commentId: string) {
    const user = this.userData.user$.getValue();
    if (!user) { throw new Error("cannot upvote if user is undefined"); }
    this.http.upvoteComment(commentId, user.id);
  }

  downvoteComment(commentId: string) {
    const user = this.userData.user$.getValue();
    if (!user) { throw new Error("cannot downvote if user is undefined"); }
    this.http.downvoteComment(commentId, user.id);
  }

  deleteCommentVote(commentId: string) {
    const user = this.userData.user$.getValue();
    if (!user) { throw new Error("cannot downvote if user is undefined"); }
    this.http.deleteVote(commentId, user.id);
  }

  toggleCheer() {
    if (!this.idea) { throw new Error("cannot react to fab click if idea is undefined"); }
    if (this.idea.userHasCheered) {
      this.setHasCheered(false);
      this.deleteCheer();
    } else {
      this.setHasCheered(true);
      this.cheer();
    }
  }

  setHasCheered(hasCheered: boolean, firstLoad = false) {
    if (!this.idea) { throw new Error("cannot set userHasCheered if idea is undefined"); }
    if (hasCheered) {
      this.idea.userHasCheered = true;
      this.mainNav.setHasCheeredFab();
      if (! firstLoad) { this.idea.supports += 1 }
    } else {
      this.idea.userHasCheered = false;
      this.mainNav.setCheerFab();
      if (! firstLoad) { this.idea.supports -= 1 }
    }
  }

  async cheer() {
    const user = this.userData.user$.getValue();
    if (!this.idea) { throw new Error("cannot cheer if idea is undefined"); }
    if (!user) { throw new Error("cannot cheer if user is undefined"); }
    return this.http.cheer(this.idea.id, user.id);
  }

  async deleteCheer() {
    const user = this.userData.user$.getValue();
    if (!this.idea) { throw new Error("cannot delete cheer if idea is undefined"); }
    if (!user) { throw new Error("cannot delete cheer if user is undefined"); }
    return this.http.deleteCheer(this.idea.id, user.id);
  }

  deleteComment(commentId: string) {
    this.comments = this.comments?.filter(c => c.id !== commentId);
    this.http.deleteComment(commentId);
  }

  postComment(body: string) {
    if (!this.idea) { throw new Error("Cannot post comment if idea is not loaded"); }
    if (!this.comments) { throw new Error("Cannot post comment if comments are not loaded"); }
    const placeholderComment = this.makePlaceholderComment(body, this.idea.id);
    const newComments = [...this.comments];  // otherwise same reference, and @Input is not updated
    newComments.unshift(placeholderComment);
    this.comments = newComments;
    this.http.postComment(this.idea.id, body).then(async insertedId => {
      const comment = await this.http.getComment(insertedId);
      this.replacePlaceholderComment(comment);
    });
  }

  makePlaceholderComment(body: string, ideaId: string): Comment {
    const user = this.userData.user$.getValue();
    if (!user) { throw new Error("Cannot post comment if user is not logged in"); }
    return {
      id: placeholder_id,
      ideaId: ideaId,
      content: body,
      author: user,
      rating: 0,
      date: new Date(),
    };
  }

  replacePlaceholderComment(comment: Comment) {
    if (!this.comments) { throw new Error("Cannot replace placeholder comment if comments is undefined"); }
    const indexOfPlaceholder = this.comments.findIndex(c => c.id === placeholder_id);
    if (indexOfPlaceholder === -1) { throw new Error(`Found no comment with id ${placeholder_id}`); }
    const newComments = [...this.comments];  // otherwise same reference, and @Input is not updated
    newComments[indexOfPlaceholder] = comment;
    this.comments = newComments;
  }

  onSortByChange(sortBy: SortBy) {
    if (!this.idea) {
      throw new Error("this.idea should be defined at this point");
    }
    this.http.getComments(sortBy, this.idea.id, undefined).then(c => this.comments = c);
  }

}
