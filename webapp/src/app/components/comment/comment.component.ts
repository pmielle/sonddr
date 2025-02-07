import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Comment } from 'sonddr-shared';
import { TimeService } from 'src/app/services/time.service';

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.scss']
})
export class CommentComponent {

  // dependencies
  // --------------------------------------------
  time = inject(TimeService);

  // I/O
  // --------------------------------------------
  @Input('comment') comment?: Comment;
  @Output('upvote') upvote = new EventEmitter<void>();
  @Output('downvote') downvote = new EventEmitter<void>();
  @Output('delete-vote') deleteVote = new EventEmitter<void>();
  @Output('delete-comment') deleteComment = new EventEmitter<void>();

  // methods
  // --------------------------------------------
  onUpvoteClick() {
    if (this.comment?.userVote && this.comment.userVote === 1) {
      this.deleteVote.next();
      this.updateRating(undefined);
    } else {
      this.upvote.next();
      this.updateRating(1);
    }
  }

  onDownvoteClick() {
    if (this.comment?.userVote && this.comment.userVote === -1) {
      this.deleteVote.next();
      this.updateRating(undefined);
    } else {
      this.downvote.next();
      this.updateRating(-1);
    }
  }

  updateRating(newUserVote: 1|-1|undefined) {
    if (! this.comment) { throw new Error("Cannot vote for an undefined comment"); }
    if (this.comment.userVote === newUserVote) { return; }
    const ratingDiff = this.comment.userVote
      ? newUserVote ? this.comment.userVote - newUserVote : this.comment.userVote
      : newUserVote ? -1 * newUserVote : 0;
    this.comment.rating -= ratingDiff;
    this.comment.userVote = newUserVote;
  }

  chooseNewRating(previousRating: number, previousUserVote: number, newUserVote: number): number {
    return previousRating + (previousUserVote - newUserVote);
  }

  chooseRatingColor(): string {
    if (!this.comment) { return ""; }
    if (this.comment.rating === 0) { return "" };
    return this.comment.rating > 0
      ? "var(--green)"
      : "var(--red)";
  }

}
