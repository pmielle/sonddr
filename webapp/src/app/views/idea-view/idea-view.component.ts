import { Component, ElementRef, HostListener, OnDestroy, ViewChild, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription, delay, filter, fromEvent, lastValueFrom, map, switchMap } from 'rxjs';
import { Comment, ExternalLink, Idea, Volunteer, placeholder_id, localized_comment_deleted } from 'sonddr-shared';
import { SortBy } from 'src/app/components/idea-list/idea-list.component';
import { HttpService } from 'src/app/services/http.service';
import { MainNavService } from 'src/app/services/main-nav.service';
import { ScreenSizeService } from 'src/app/services/screen-size.service';
import { TimeService } from 'src/app/services/time.service';
import { MatDialog } from '@angular/material/dialog';
import { UserDataService } from 'src/app/services/user-data.service';
import { TranslationService } from 'src/app/services/translation.service';
import { AuthService } from 'src/app/services/auth.service';
import { AddLocalizedCommentPopupComponent } from 'src/app/components/add-localized-comment-popup/add-localized-comment-popup.component';
import { CdkContextMenuTrigger } from '@angular/cdk/menu';

type LCGroup = {
  localizedComments: LocalizedComment[],
  y: number,
};

type LocalizedComment = {
  comment: Comment,
  spans: [HTMLElement, HTMLElement],
};

type QuoteTmp = {
  text: string,
  spans: [HTMLElement, HTMLElement|undefined],
};

type Localization = {
  offset: number,
  type: 'start'|'end',
  commentId: string,
};

type ActiveSelection = {
  selection: Selection,
  isMobile: boolean,
  mouseUp: MouseEvent,
}

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
  i18n = inject(TranslationService);
  auth = inject(AuthService);

  // i/o
  // --------------------------------------------
  @ViewChild('menuTrigger') menuTrigger?: CdkContextMenuTrigger;
  @ViewChild('content') contentRef?: ElementRef;
  @ViewChild('activeBubble') activeBubble?: ElementRef;
  @HostListener('document:click', ['$event']) clickout(event: MouseEvent) {
    if (!this.activeLCGroup) { return; }
    if (!this.activeBubble!.nativeElement!.contains(event.target)) {
      if (this.firstClickOut) {
        this.closeBubble();
      } else {
        this.firstClickOut = true;
      }
    }
  }

  // attributes
  // --------------------------------------------
  idea?: Idea;
  comments?: Comment[];
  localizedComments: LocalizedComment[] = [];
  lcGroups: LCGroup[] = [];
  volunteers?: Volunteer[];
  routeSub?: Subscription;
  popupSub?: Subscription;
  resizeSub?: Subscription;
  activeLCGroup?: LCGroup;
  selectionSub?: Subscription;
  firstClickOut = false;  // opening the bubble triggers clickout: ignore the first event
  activeSele?: ActiveSelection;

  // lifecycle hooks
  // --------------------------------------------
  ngOnInit(): void {
    this.selectionSub = this.screen.isMobile$.pipe(
      switchMap((isMobile: boolean) => isMobile ? this.getMobileSelection() : this.getDesktopSelection()),
      filter((sele: ActiveSelection) => this.isInContent(sele.selection)),
    ).subscribe((sele: ActiveSelection) => {
      let popupX = sele.mouseUp.clientX;
      let popupY = sele.mouseUp.clientY;
      if (sele.isMobile) { popupY += 10; popupX += 10; }
      this.menuTrigger!.open({ x: popupX, y: popupY });
      this.activeSele = sele;
    });
    this.routeSub = this.route.paramMap.subscribe(map => {
      const id = map.get("id");
      if (!id) { throw new Error("id not found in url params"); }
      this.http.getIdea(id).then(i => {
        this.idea = i;
        this.setHasCheered(i.userHasCheered, true);
      });
      this.http.getComments("recent", id, undefined).then(c => {
        this.comments = c;
        setTimeout(() => {
          this.localizeComments();
          this.setLCGroups();
        }, 500);
      });
      this.http.getVolunteers(id, undefined).then(v => this.volunteers = v);
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.popupSub?.unsubscribe();
    this.resizeSub?.unsubscribe();
    this.selectionSub?.unsubscribe();
  }

  // methods
  // --------------------------------------------
  localizeComments() {
    // remove previous spans
    document.querySelectorAll(".localized-comment")
      .forEach((elem) => elem.remove());
    let localizations = this._getFilterAndSortLocalizations(this.comments!);
    if (!localizations.length) {
      this.localizedComments = [];
      return;
    }
    // walk and insert spans
    let localization = localizations.shift();
    let offset = 0;
    let content = this.contentRef?.nativeElement as HTMLElement;
    let walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
    let node: Node | null = null;
    let tmp: Map<string, QuoteTmp> = new Map();
    let localizedComments: LocalizedComment[] = [];
    main: while (node = walker.nextNode()) {
      let text = node as Text;
      for (let i = 0; i < text.textContent!.length; i++) {
        if (offset === localization!.offset) {
          while (offset === localization!.offset) {  // there can be multiple comments at this offset
            let span = this._insertSpan(localization!, text, i);
            if (tmp.has(localization!.commentId)) {
              // this is an end span: we are done with this comment
              // add it to the final localizedComments list
              tmp.get(localization!.commentId)!.spans[1] = span;
              let tmpQuote = tmp.get(localization!.commentId)!;
              tmpQuote.spans[1] = span;
              let comment = this.comments!.find(c => c.id === localization!.commentId)!;
              comment.quote = tmpQuote.text;
              localizedComments.push({
                comment: comment,
                spans: tmpQuote.spans as [HTMLElement, HTMLElement],
              });
              tmp.delete(localization!.commentId);
            } else {
              // this is a start span
              tmp.set(localization!.commentId, {text: "", spans: [span, undefined]});
            }
            // prepare for next one
            localization = localizations.shift();
            if (!localization) { break main; }
          }
        } else {
          // only if no match: because after insertion, the same offset will be re-evaluated
          // because the span breaks the current text node
          tmp.forEach((quoteTmp, _) => { quoteTmp.text += text.textContent![i]});
          offset += 1;
        }
      }
    }
    if (localization || tmp.size) { throw new Error("Failed to place some comments"); }
    this.localizedComments = localizedComments;
  }

  isInContent(sele: Selection): boolean {
    const content = (this.contentRef!.nativeElement as HTMLElement);
    return content.contains(sele.anchorNode) && content.contains(sele.focusNode);
    // TODO: debug from here
  }

  getMobileSelection(): Observable<ActiveSelection> {
    return fromEvent(document, "contextmenu").pipe(
      map((e: Event) => e as MouseEvent),
      map((e) => ({ selection: document.getSelection()!, isMobile: true, mouseUp: e })),
      filter((sele: ActiveSelection) => sele.selection.toString().length > 0),
    );
  }

  getDesktopSelection(): Observable<ActiveSelection> {
    return fromEvent(document, "selectionchange").pipe(
      map(() => document.getSelection()!),
      filter((sele: Selection) => sele.type === "Range"),
      switchMap((sele: Selection) => {
        return fromEvent(document, "mouseup").pipe(
          map((e) => e as MouseEvent),
          map((e) => ({ selection: sele, isMobile: false, mouseUp: e }))
        );
      }),
      filter((sele: ActiveSelection) => sele.selection.toString().length > 0),
      delay(0), // otherwise does not work
    );
  }

  async addLocalizedComment() {
    let range = this.activeSele!.selection.getRangeAt(0);
    let quote = range.toString();
    document.getSelection()!.removeAllRanges(); // clean things up before opening popup
    if (!this.auth.isLoggedIn()) {  // after selection clear
      this.auth.openAuthSnack();
      return;
    }
    let body = await this._openLocalizedCommentPopup(quote);
    if (body) {
      let [startSpan, endSpan] = this._positionComment(placeholder_id, range);
      let [startOffset, endOffset] = this._getOffsetsInContent(startSpan, endSpan);
      let comment = await this.postComment(body, [startOffset, endOffset]);
      startSpan.id = this._makeSpanId('start', comment.id);
      endSpan.id = this._makeSpanId('end', comment.id);
      comment.quote = quote;
      this.localizedComments.push({
        comment: comment,
        spans: [startSpan, endSpan],
      });
      this.setLCGroups();
    }
  }

  closeBubble() {
    this.firstClickOut = false;
    this.activeLCGroup = undefined;
  }

  setLCGroups() {
    let lcGroups: LCGroup[] = [];
    let binheight = 100;
    this.localizedComments.sort(
      (a, b) => b.comment.date.getTime() - a.comment.date.getTime()
    ).forEach((lc: LocalizedComment) => {
      let y = this._chooseLCY(lc);
      let found = false;
      lcGroups.forEach((lcGroup) => {
        if ((lcGroup.y - binheight / 2) < y && y <= (lcGroup.y + binheight / 2)) {
          lcGroup.localizedComments.push(lc);
          found = true;
        }
      });
      if (! found) { lcGroups.push({ y: y, localizedComments: [ lc ] }); }
    });
    this.lcGroups = lcGroups;
  }

  _chooseLCY(localizedComment: LocalizedComment): number {
    let [startSpan, endSpan] = localizedComment.spans;
    let top = startSpan.offsetTop === endSpan.offsetTop
      ? startSpan.offsetTop
      : (startSpan.offsetTop + endSpan.offsetTop) / 2;
    top -= 5; // looks nicer
    return Math.round(top);
  }

  _getFilterAndSortLocalizations(comments: Comment[]): Localization[] {
    let offsets: Localization[] = [];
    comments.forEach(c => {
      if (c.location) {
        if (c.location.toString() === localized_comment_deleted.toString()) {
          // the location of this comment has been soft deleted
          c.quote = "-1";
        } else {
          offsets.push(
            { offset: c.location[0], type: "start", commentId: c.id },
            { offset: c.location[1], type: "end", commentId: c.id },
          );
        }
      }
    });
    offsets.sort((a, b) => a.offset - b.offset);
    return offsets;
  }

  _insertSpan(localization: Localization, text: Text, offsetInText: number): HTMLElement {
    let span = this._createSpan(localization.type, localization.commentId);
    const remain = text.splitText(offsetInText);
    text.parentNode!.insertBefore(span, remain);  // insert before 'remain'
    return span;
  }

  _getOffsetsInContent(startSpan: HTMLElement, endSpan: HTMLElement): [number, number] {
    let content = this.contentRef?.nativeElement as HTMLElement;
    let walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
    let node: Node | null = null;
    let startOffset = 0;
    let endOffset = 0;
    node = walker.nextNode();
    if (!node) { throw new Error("Failed to getOffsetsInContent"); }
    while (node.compareDocumentPosition(startSpan) & Node.DOCUMENT_POSITION_FOLLOWING) {
      startOffset += node.textContent!.length;
      endOffset += node.textContent!.length;
      node = walker.nextNode();
      if (!node) { throw new Error("Failed to getOffsetsInContent"); }
    }
    while (node.compareDocumentPosition(endSpan) & Node.DOCUMENT_POSITION_FOLLOWING) {
      endOffset += node.textContent!.length;
      node = walker.nextNode();
      if (!node) { break; }
    }
    if (endOffset <= startOffset) { throw new Error("Failed to getOffsetsInContent"); }
    return [startOffset, endOffset];
  }

  async _openLocalizedCommentPopup(quote: string): Promise<string> {
    const dialogRef = this.dialog.open(AddLocalizedCommentPopupComponent, {
      data: { quote: quote },
      panelClass: "custom-popup",
    });
    let body = await lastValueFrom(dialogRef.afterClosed()) as string;
    return body;
  }

  _createSpan(type: 'start' | 'end', commentId: string): HTMLElement {
    let span = document.createElement("span");
    span.id = this._makeSpanId(type, commentId);
    span.classList.add("localized-comment");
    return span;
  }

  _makeSpanId(type: 'start' | 'end', commentId: string): string {
    return `${type}:${commentId}`;
  }

  _positionComment(commentId: string, range: Range): [HTMLElement, HTMLElement] {
    let startSpan = this._createSpan('start', commentId);
    let endSpan = this._createSpan('end', commentId);
    range.insertNode(startSpan); // at the beginning of the range
    range.collapse(false); // trick: collapse to the end and insertNode again
    range.insertNode(endSpan);
    return [startSpan, endSpan];
  }

  setHasCheered(hasCheered: boolean, firstLoad = false) {
    if (!this.idea) { throw new Error("cannot set userHasCheered if idea is undefined"); }
    if (hasCheered) {
      this.idea.userHasCheered = true;
      this.mainNav.setFab({
        icon: "favorite",
        color: "var(--primary-color)",
        label: "✅",
        action: () => this.toggleCheer(),
      });
      if (!firstLoad) { this.idea.supports += 1 }
    } else {
      this.idea.userHasCheered = false;
      this.mainNav.setFab({
        icon: "favorite_outline",
        color: "var(--primary-color)",
        label: this.i18n.get("fab.cheer"),
        action: () => this.toggleCheer(),
      });
      if (!firstLoad) { this.idea.supports -= 1 }
    }
  }

  addFinancing(e: any) {
    console.log("add financing")
    console.log(e)
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
    this.mainNav.navigateTo("/ideas");
  }

  async onEditClick() {
    this.mainNav.navigateTo(
      `/ideas/add?edit=${this.idea!.id}`,
      true,
      { skipLocationChange: true }
    );
  }

  chooseCover() {
    const gradient = 'var(--cover-gradient)';
    return this.idea?.cover ? `${gradient}, url(${this.http.getImageUrl(this.idea.cover)}` : gradient;
  }

  upvoteComment(commentId: string) {
    if (!this.auth.isLoggedIn()) {  // after selection clear
      this.auth.openAuthSnack();
      return;
    }
    const user = this.userData.user$.getValue();
    if (!user) { throw new Error("cannot upvote if user is undefined"); }
    this.http.upvoteComment(commentId, user.id);
  }

  downvoteComment(commentId: string) {
    if (!this.auth.isLoggedIn()) {  // after selection clear
      this.auth.openAuthSnack();
      return;
    }
    const user = this.userData.user$.getValue();
    if (!user) { throw new Error("cannot downvote if user is undefined"); }
    this.http.downvoteComment(commentId, user.id);
  }

  deleteCommentVote(commentId: string) {
    if (!this.auth.isLoggedIn()) {  // after selection clear
      this.auth.openAuthSnack();
      return;
    }
    const user = this.userData.user$.getValue();
    if (!user) { throw new Error("cannot downvote if user is undefined"); }
    this.http.deleteVote(commentId, user.id);
  }

  toggleCheer() {
    if (!this.idea) { throw new Error("cannot react to fab click if idea is undefined"); }
    if (!this.auth.isLoggedIn()) {
      this.auth.openAuthSnack();
      return;
    }
    if (this.idea.userHasCheered) {
      this.setHasCheered(false);
      this.deleteCheer();
    } else {
      this.setHasCheered(true);
      this.cheer();
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

  addVolunteer(description: string) {
    if (!this.idea) { throw new Error("Cannot add volunteer if idea is not loaded"); }
    if (!this.volunteers) { throw new Error("Cannot add volunteer if volunteers are not loaded"); }
    const volunteerPlaceholder = this.makeVolunteerPlaceholder(description, this.idea);
    this.volunteers = [...this.volunteers, volunteerPlaceholder];
    this.http.createVolunteer(this.idea.id, description)
      .then(id => this.updateVolunteerPlaceholder(id));
  }

  makeVolunteerPlaceholder(description: string, idea: Idea): Volunteer {
    const user = this.userData.user$.getValue();
    if (!user) { throw new Error("Cannot create volunteer if user is not logged in"); }
    return {
      id: placeholder_id,
      idea: idea,
      description: description,
      candidates: [],
    };
  }

  updateVolunteerPlaceholder(id: string) {
    if (!this.volunteers) { throw new Error("Cannot replace volunteer placeholder if volunteers is undefined"); }
    const indexOfPlaceholder = this.volunteers.findIndex(c => c.id === placeholder_id);
    if (indexOfPlaceholder === -1) { throw new Error(`Found no comment with id ${placeholder_id}`); }
    const newVolunteers = [...this.volunteers];  // otherwise same reference, and @Input is not updated
    newVolunteers[indexOfPlaceholder].id = id;
    this.volunteers = newVolunteers;
  }

  deleteComment(commentId: string) {
    if (this.activeLCGroup?.localizedComments.find(c => c.comment.id === commentId)) { this.closeBubble(); }
    this.comments = this.comments?.filter(c => c.id !== commentId);
    this.localizeComments();
    this.setLCGroups();
    this.http.deleteComment(commentId);
  }

  onPostCommentClick(body: string) {
    if (!this.auth.isLoggedIn()) {
      this.auth.openAuthSnack();
      return;
    }
    this.postComment(body);
  }

  async postComment(body: string, location?: [number, number]): Promise<Comment> {
    const placeholderComment = this.makePlaceholderComment(body, this.idea!.id);
    this.comments = [placeholderComment, ...this.comments!];  // otherwise same reference, and @Input is not updated
    let insertedId = await this.http.postComment(this.idea!.id, body, location);
    const comment = await this.http.getComment(insertedId);
    this.replacePlaceholderComment(comment);
    return comment;
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
