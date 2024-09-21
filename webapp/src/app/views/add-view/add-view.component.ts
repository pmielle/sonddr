import { Component, ViewChild, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, combineLatest, from, of, switchMap } from 'rxjs';
import { Draft, Goal, Idea } from 'sonddr-shared';
import { HttpService } from 'src/app/services/http.service';
import { AuthService } from 'src/app/services/auth.service';
import { MainNavService } from 'src/app/services/main-nav.service';
import { ScreenSizeService } from 'src/app/services/screen-size.service';
import { EditorComponent } from 'src/app/components/editor/editor.component';
import { UserDataService } from 'src/app/services/user-data.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslationService } from 'src/app/services/translation.service';

@Component({
  selector: 'app-add-view',
  templateUrl: './add-view.component.html',
  styleUrls: ['./add-view.component.scss']
})
export class AddViewComponent {

  // dependencies
  // --------------------------------------------
  route = inject(ActivatedRoute);
  http = inject(HttpService);
  screen = inject(ScreenSizeService);
  auth = inject(AuthService);
  mainNav = inject(MainNavService);
  router = inject(Router);
  userData = inject(UserDataService);
  snack = inject(MatSnackBar);
  i18n = inject(TranslationService);

  // attributes
  // --------------------------------------------
  mainSub?: Subscription;
  fabSub?: Subscription;
  ideas?: Idea[];
  goals?: Goal[];
  selectedGoals: Goal[] = [];
  selectableGoals: Goal[] = [];
  coverPreview?: string;
  title = "";
  cover?: File;
  editIdeaId?: string;
  initialContent?: string;
  initialTitle?: string;
  initialGoals?: Goal[];
  @ViewChild(EditorComponent) editor!: EditorComponent;
  draftTimeout: any;
  draft?: Draft;

  // lifecycle hooks
  // --------------------------------------------
  ngOnInit(): void {

    // get data
    this.mainSub = combineLatest([
      this.route.queryParamMap,
      from(this.http.getGoals()),
      this.userData.user$.pipe(
        switchMap((u) => u ? from(this.http.getDrafts(u.id)) : of(undefined))
      ),
    ]).subscribe(([map, goals, drafts]) => {

      // get all goals
      this.goals = goals;
      this.selectableGoals = goals;

      // early return if edit mode
      const editIdeaId = map.get("edit");
      const preselectedGoalId = map.get("preselected");
      this.editIdeaId = undefined;
      if (editIdeaId) {
        this.editIdeaId = editIdeaId;
        this.http.getIdea(editIdeaId).then(idea => {
          if (! idea.author.isUser) { throw new Error("Unauthorized"); }
          this.setupEdit(idea);
        });
        return;
      }

      // pre-fill things:
      // draft or goal preselection
      if (drafts && drafts.length) {

        if (drafts.length > 1) { throw new Error("No more than 1 draft per user is expected"); }
        const draft = drafts[0];
        this.restoreDraft(draft);

      } else if (preselectedGoalId) {
        const goal = goals.find(g => g.id === preselectedGoalId);
        if (!goal) {
          throw new Error(`Failed to preselect ${preselectedGoalId}: no matching goal found`);
        }
        this.selectGoal(goal, true);
      }

    });

    // hide bottom bar and disable fab
    setTimeout(() => {
      this.mainNav.hideNavBar();
      this.mainNav.disableFab();
    }, 100); // otherwise NG0100

    // listen to fab clicks
    this.fabSub = this.mainNav.fabClick.subscribe(() => {
      if (this.editIdeaId) {
        this.submitEdit();
      } else {
        this.submit();
      }
    });
  }

  ngOnDestroy(): void {

    // unsubscribe
    this.mainSub?.unsubscribe();
    this.fabSub?.unsubscribe();

    // restore nav bar and fab
    this.mainNav.showNavBar();
    this.mainNav.restoreFab();

    // stop any draft save
    if (this.draftTimeout) {
      clearInterval(this.draftTimeout);
      this.refreshDraft();
    }

  }

  // methods
  // --------------------------------------------
  restoreDraft(draft: Draft) {
    this.draft = draft;  // save it for later use
    if (draft.title) { this.title = draft.title }
    if (draft.content) { this.editor.setContent(draft.content) }
    if (draft.goalIds) {
      this.goals!
      .filter(g => draft.goalIds?.includes(g.id))
      .forEach(g => this.selectGoal(g, true));
    }
    setTimeout(() => this.refreshFabDisplay(), 300);
    this.snack.open("Draft restored", "Discard", { duration: 5 * 1e3 }).onAction().subscribe(() => {
      this.discardDraft();
    });
  }

  discardDraft() {
    this.http.deleteDraft(this.draft!.id);
    this.draft = undefined;
    this.title = "";
    this.editor.setContent("");
    this.deselectAllGoals();
    this.refreshFabDisplay();
  }

  onKeyUp() {
    this.debouceRefreshDraft(5);
    this.refreshFabDisplay();
  }

  debouceRefreshDraft(debouceSec: number) {
    if (this.draftTimeout) { clearTimeout(this.draftTimeout) }
    this.draftTimeout = setTimeout(() => {
      this.refreshDraft();
    }, debouceSec * 1e3);
  }

  refreshDraft() {

    // empty form: delete draft if any
    if (
      this.draft !== undefined
      && (!this.title && !this.editor.content && !this.selectedGoals.length)
    ) {
      this.http.deleteDraft(this.draft.id);
      return;
    }

    // content but no draft: create it
    if (this.draft === undefined
       && (this.title || this.editor.content || this.selectedGoals.length)
    ) {
      this.saveDraft();
      return;
    }

    // something has changed: update draft
    if (
      this.draft
      && (
        this.draft.title !== this.title
        || this.draft.content !== this.editor.content
        || this.draft.goalIds?.sort()?.toString() !== this.selectedGoals?.map(g => g.id).sort()?.toString()
      )
    ) {
      this.saveDraft();
      return;
    }

  }

  async saveDraft() {
    const t = this.title;
    const c = this.editor.content;
    const g = this.selectedGoals;
    let id = this.draft?.id;
    if (this.draft) {
      this.http.editDraft(this.draft.id, t, c , g);
    } else {
      id = await this.http.createDraft(t, c ,g);
    }
    this.draft = {
      id: id!,
      authorId: "placeholder",
      title: t,
      content: c,
      goalIds: g?.map(g => g.id),
    };
  }

  chooseCover() {
    const gradient = 'var(--cover-gradient)';
    return this.coverPreview ? `${gradient}, url(${this.coverPreview})` : gradient;
  }

  setupEdit(idea: Idea) {
    this.title = idea.title;
    idea.goals.forEach(g => this.selectGoal(g));
    this.editor.setContent(idea.content);
    this.initialTitle = idea.title;
    this.initialContent = idea.content;
    this.initialGoals = idea.goals;
    if (idea.cover) { this.coverPreview = this.http.getImageUrl(idea.cover); }
    this.refreshFabDisplay();
  }

  onTitleTab(e: Event) {
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
    const result = (this.editor.content && this.title && this.selectedGoals.length)
      ? true
      : false;
    return result;
  }

  async submitEdit(): Promise<void> {
    if (! this.formIsValid() || ! this.somethingHasBeenEdited()) {
      throw new Error("submit should not be callable if one input is empty or if nothing has changed");
    }
    await this.http.editIdea(
      this.editIdeaId!,
      this.titleHasChanged() ? this.title : undefined,
      this.contentHasChanged() ? this.editor.content : undefined,
      this.goalsHaveChanged() ? this.selectedGoals : undefined,
      this.cover,
      this.editor.images,
    );
    setTimeout(() => this.router.navigateByUrl(
      `/ideas/idea/${this.editIdeaId!}`,
      {skipLocationChange: true}
    ), 100); // otherwise doesn't refresh for some reason
  }

  async submit(): Promise<void> {
    if (this.formIsValid()) {
      const id = await this.http.postIdea(
        this.title,
        this.editor.content,
        this.selectedGoals.map(g => g.id),
        this.cover,
        this.editor.images,
      );
      if (this.draft) {
        this.http.deleteDraft(this.draft.id);
      }
      this.router.navigateByUrl(
        `/ideas/idea/${id}`,
        {replaceUrl: true}
      );
    } else {
      throw new Error("submit should not be callable if one input is empty");
    }
  }

  onCoverChange(file: File) {
    this.cover = file;
    this.coverPreview = URL.createObjectURL(file);
    this.refreshFabDisplay();
  }

  refreshFabDisplay() {
    if (this.editIdeaId) {
      if (this.formIsValid() && this.somethingHasBeenEdited()) {
        this.mainNav.enableFab();
      } else {
        this.mainNav.disableFab();
      }
    } else {
      if (this.formIsValid()) {
        this.mainNav.enableFab();
      } else {
        this.mainNav.disableFab();
      }
    }
  }

  somethingHasBeenEdited(): boolean {
    return this.coverHasChanged() || this.titleHasChanged() || this.contentHasChanged() || this.goalsHaveChanged();
  }

  titleHasChanged(): boolean {
    return this.title !== this.initialTitle;
  }

  contentHasChanged(): boolean {
    return this.editor.content !== this.initialContent;
  }

  coverHasChanged(): boolean {
    return this.cover !== undefined;
  }

  goalsHaveChanged(): boolean {
    return ! this.areGoalsEq(this.selectedGoals, this.initialGoals);
  }

  areGoalsEq(a: Goal[]|undefined, b: Goal[]|undefined): boolean {
    return a?.toString() === b?.toString();
  }

  deselectAllGoals() {
    this.selectedGoals = [];
    this.selectableGoals = this.goals!;
  }

  deselectGoal(goal: Goal, silent: boolean = false) {
    this.selectedGoals = this.selectedGoals.filter(g => g.id !== goal.id);
    this.selectableGoals.unshift(goal);
    if (!silent) {
      this.onKeyUp();
    }
  }

  selectGoal(goal: Goal, silent: boolean = false) {
    this.selectedGoals.unshift(goal);
    this.selectableGoals = this.selectableGoals.filter(g => g.id !== goal.id);
    if (!silent) {
      this.onKeyUp();
    }
  }

}
