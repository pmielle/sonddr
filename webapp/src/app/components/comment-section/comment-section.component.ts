import { Component, ElementRef, EventEmitter, Input, Output, SimpleChanges, ViewChild, inject } from '@angular/core';
import { Comment } from 'sonddr-shared';
import { ColorService } from 'src/app/services/color.service';
import { ScreenSizeService } from 'src/app/services/screen-size.service';
import { TimeService } from 'src/app/services/time.service';
import { UserDataService } from 'src/app/services/user-data.service';

export type SortBy = "recent" | "popular";

export type ListSection = {
  header: string,
  comments: Comment[],
  stuck: boolean,
};

@Component({
  selector: 'app-comment-section',
  templateUrl: './comment-section.component.html',
  styleUrls: ['./comment-section.component.scss']
})
export class CommentSectionComponent {

  // dependencies
  // --------------------------------------------
  screen = inject(ScreenSizeService);
  color = inject(ColorService);
  time = inject(TimeService);
  userData = inject(UserDataService);

  // i/o
  // --------------------------------------------
  @Input("comments") comments?: Comment[];
  @Output("sort-by-change") sortByChange = new EventEmitter<SortBy>();
  @Output("post-comment") postComment = new EventEmitter<string>();
  @Output("upvote") upvote = new EventEmitter<string>();
  @Output("downvote") downvote = new EventEmitter<string>();
  @Output("delete-vote") deleteVote = new EventEmitter<string>();
  @Output("delete-comment") deleteComment = new EventEmitter<string>();
  @Output("focus") focus = new EventEmitter<void>();
  @Output("blur") blur = new EventEmitter<void>();

  // attributes
  // --------------------------------------------
  sections?: ListSection[];
  sortBy: SortBy = "recent";
  isCollapsed = true;
  commentBody = "";
  @ViewChild('input') input?: ElementRef;

  // lifecycle hooks
  // --------------------------------------------
  ngOnChanges(changes: SimpleChanges): void {
    const change = changes["comments"];
    if (!change) { return; }
    let comments = change.currentValue;
    this.sections = comments && comments.length ? this.splitCommentsIntoSections(comments) : undefined;
  }

  // methods
  // --------------------------------------------
  onPostComment() {
    if (!this.formIsValid()) { return; }
    this.postComment.next(this.commentBody);
    this.commentBody = "";
    this.input?.nativeElement.blur();
  }

  formIsValid(): boolean {
    return (this.commentBody.length) ? true : false;
  }

  makeLabel(): string|undefined {
    if (!this.comments) { return undefined; }
    if (!this.comments.length) { return undefined; }
    const otherNb = this.comments.length - 1;
    if (otherNb <= 0) { return undefined; }
    const plural = otherNb > 1;
    return `See ${otherNb} other comment${plural ? 's' : ''}`;
  }

  splitCommentsIntoSections(comments: Comment[]): ListSection[] {
    let sections: ListSection[] = [
      this._initSection(this.sortBy == "recent" ? "Today" : "Top 10"),
      this._initSection(this.sortBy == "recent" ? "This week" : "Top 50"),
      this._initSection("")
    ];
    if (this.sortBy == "recent") {
      const now = new Date();
      const aDayAgo = this.time.getNDaysBefore(now, 1);
      const aWeekAgo = this.time.getNDaysBefore(now, 7);
      comments.forEach(i => {
        let sectionIndex = i.date > aDayAgo ? 0
          : i.date > aWeekAgo ? 1
          : 2;
        sections[sectionIndex].comments.push(i);
      });
    } else {
      let cpt = 0;
      comments.forEach(i => {
        cpt++;
        let sectionIndex = cpt <= 10 ? 0
          : cpt <= 25 ? 1
          : 2;
        sections[sectionIndex].comments.push(i);
      });
    }
    return sections.filter(s => s.comments.length > 0);
  }

  shouldDisplaySortBy(): boolean {
    if (this.sections && this.sections.length > 0 && this.sections[0].stuck) {
      return false;
    }
    return true;
  }
  updateSortBy(sortBy: SortBy) {
    this.sortBy = sortBy;
    this.sortByChange.next(sortBy);
  }

  // private methods
  // --------------------------------------------
  _initSection(header: string): ListSection {
    return { header: header, comments: [], stuck: false }
  }

}
