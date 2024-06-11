import { Component, ViewChild, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, combineLatest, from } from 'rxjs';
import { Goal, Idea } from 'sonddr-shared';
import { HttpService } from 'src/app/services/http.service';
import { AuthService } from 'src/app/services/auth.service';
import { MainNavService } from 'src/app/services/main-nav.service';
import { ScreenSizeService } from 'src/app/services/screen-size.service';
import { EditorComponent } from 'src/app/components/editor/editor.component';

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

  // lifecycle hooks
  // --------------------------------------------
  ngOnInit(): void {

    // get data
    this.mainSub = combineLatest([
      this.route.queryParamMap,
      from(this.http.getGoals()),
    ]).subscribe(([map, goals]) => {

      // get all goals
      this.goals = goals;
      this.selectableGoals = goals;

      // depending on query:
      // - preselect a goal
      // - edit an existing idea
      const editIdeaId = map.get("edit");
      const preselectedGoalId = map.get("preselected");
      this.editIdeaId = undefined;
      if (editIdeaId) {
        this.editIdeaId = editIdeaId;
        this.http.getIdea(editIdeaId).then(idea => {
          if (! idea.author.isUser) { throw new Error("Unauthorized"); }
          this.setupEdit(idea);
        });

      } else if (preselectedGoalId) {
        const goal = goals.find(g => g.id === preselectedGoalId);
        if (!goal) {
          throw new Error(`Failed to preselect ${preselectedGoalId}: no matching goal found`);
        }
        this.selectGoal(goal);
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
  }

  // methods
  // --------------------------------------------
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
    return (this.editor.content && this.title && this.selectedGoals.length) ? true : false;
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

  selectGoal(goal: Goal) {
    // add it to selected list
    if (! this.selectedGoals.find(g => g.id === goal.id)) {
      this.selectedGoals.unshift(goal);
    }
    // remove it from selectable list
    const i = this.selectableGoals.findIndex(g => g.id === goal.id);
    if (i !== -1) {
      this.selectableGoals.splice(i, 1);
    }
    // refresh the fab display
    this.refreshFabDisplay();
  }

}
