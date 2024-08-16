import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Idea, User, Volunteer, placeholder_id } from 'sonddr-shared';
import { AddVolunteerPopupComponent } from 'src/app/components/add-volunteer-popup/add-volunteer-popup.component';
import { HttpService } from 'src/app/services/http.service';
import { MainNavService } from 'src/app/services/main-nav.service';
import { UserDataService } from 'src/app/services/user-data.service';

@Component({
  selector: 'app-volunteers-view',
  templateUrl: './volunteers-view.component.html',
  styleUrl: './volunteers-view.component.scss'
})
export class VolunteersViewComponent implements OnInit, OnDestroy {

  // dependencies
  // --------------------------------------------
  http = inject(HttpService);
  route = inject(ActivatedRoute);
  mainNav = inject(MainNavService);
  userData = inject(UserDataService);
  router = inject(Router);
  dialog = inject(MatDialog);

  // attributes
  // --------------------------------------------
  openPositions: Volunteer[] = [];
  filledPositions: Volunteer[] = [];
  isAdmin: boolean = false;
  idea?: Idea;
  expandedCandidates: Map<string, boolean> = new Map();
  routeSub?: Subscription;
  popupSub?: Subscription;
  fabClickSub?: Subscription;

  // lifecycle hooks
  // --------------------------------------------
  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe((map) => {
      const id = map.get("id")!;
      this.http.getVolunteers(id).then(v => {
        this.idea = v[0].idea;
        this.setIsAdmin(); // do this after setting this.idea
        this.setVolunteers(v)
      });
    });
    setTimeout(() => this.mainNav.hideNavBar(), 100); // otherwise NG0100
    this.fabClickSub = this.mainNav.fabClick.subscribe(() => this.openVolunteerPopup());
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe;
    this.mainNav.showNavBar();
    this.popupSub?.unsubscribe();
    this.fabClickSub?.unsubscribe();
  }

  // methods
  // --------------------------------------------
  openVolunteerPopup() {
    const dialogRef = this.dialog.open(AddVolunteerPopupComponent);
    this.popupSub = dialogRef.afterClosed().subscribe((description) => {
      if (description) {
        this.addVolunteer(description);
      }
    });
  }

  addVolunteer(description: string) {
    const volunteerPlaceholder = this.makeVolunteerPlaceholder(description);
    this.openPositions = [...this.openPositions, volunteerPlaceholder];
    this.http.createVolunteer(this.idea!.id, description)
      .then(id => this.updateVolunteerPlaceholder(id));
  }

  makeVolunteerPlaceholder(description: string): Volunteer {
    const user = this.userData.user$.getValue();
    if (!user) { throw new Error("Cannot create volunteer if user is not logged in"); }
    return {
      id: placeholder_id,
      idea: this.idea!,
      description: description,
      candidates: [],
    };
  }

  updateVolunteerPlaceholder(id: string) {
    const indexOfPlaceholder = this.openPositions.findIndex(c => c.id === placeholder_id);
    if (indexOfPlaceholder === -1) { throw new Error(`Found no volunteers with id ${placeholder_id}`); }
    this.openPositions[indexOfPlaceholder].id = id;
    this.openPositions = [...this.openPositions];  // otherwise does not update
  }

  isExpanded(v: Volunteer): boolean {
    return (this.expandedCandidates.has(v.id) && this.expandedCandidates.get(v.id) === true);
  }

  onExpand(v: Volunteer) {
    this.expandedCandidates.set(v.id, true);
  }

  didApply(v: Volunteer) {
    if (! v.candidates) { return false };
    for (let u of v.candidates) {
      if (u.isUser) { return true; }
    }
    return false;
  }

  onRefuse(v: Volunteer, c: User) {
    this.http.refuseVolunteerCandidate(v.id, c.id);
    v.candidates = v.candidates.filter(u => u.id !== c.id);
    this.updateOpenPosition(v);
  }

  onDelete(v: Volunteer) {
    this.http.deleteVolunteer(v.id).then(() => {
      if (this.filledPositions.length + this.openPositions.length == 0) {
        this.router.navigateByUrl(`/ideas/idea/${this.idea!.id}`);
      }
    });
    this.deletePosition(v.id);
  }

  onRemove(v: Volunteer) {
    this.http.removeVolunteerUser(v.id);
    v.user = undefined;
    this.openPosition(v);
  }

  onAccept(v: Volunteer, c: User) {
    this.http.acceptVolunteerCandidate(v.id, c.id);
    v.user = c;
    v.candidates = [];
    this.fillPosition(v);
  }

  onApply(v: Volunteer) {
    this.http.addVolunteerCandidate(v.id);
    const user = this.userData.user$.getValue()!;
    v.candidates.push(user);
    this.updateOpenPosition(v);
  }

  onCancel(v: Volunteer) {
    this.http.removeVolunteerCandidate(v.id);
    const user = this.userData.user$.getValue()!;
    v.candidates = v.candidates.filter(u => u.id !== user.id);
    this.updateOpenPosition(v);
  }

  setIsAdmin() {
    this.isAdmin = this.idea!.author.isUser;
  }

  setVolunteers(volunteers: Volunteer[]) {
    for (let volunteer of volunteers) {
      if (volunteer.user) {
        this.filledPositions.push(volunteer);
      } else {
        this.openPositions.push(volunteer);
      }
    }
  }

  deletePosition(id: string) {
    let i = this.openPositions.findIndex(volunteer => volunteer.id === id);
    if (i >= 0) {
      this.openPositions.splice(i, 1);
      this.openPositions = [...this.openPositions];
      return;
    }
    i = this.filledPositions.findIndex(volunteer => volunteer.id === id);
    if (i >= 0) {
      this.filledPositions.splice(i, 1);
      this.filledPositions = [...this.filledPositions];
      return;
    }
  }

  updateOpenPosition(v: Volunteer) {
    const i = this.openPositions.findIndex(volunteer => volunteer.id === v.id);
    this.openPositions[i] = v;
    this.openPositions = [...this.openPositions];
  }

  openPosition(v: Volunteer) {
    const i = this.filledPositions.findIndex(volunteer => volunteer.id === v.id);
    this.filledPositions.splice(i, 1);
    this.openPositions.push(v);
    this.filledPositions = [...this.filledPositions];
    this.openPositions = [...this.openPositions];
  }

  fillPosition(v: Volunteer) {
    const i = this.openPositions.findIndex(volunteer => volunteer.id === v.id);
    this.openPositions.splice(i, 1);
    this.filledPositions.push(v);
    this.openPositions = [...this.openPositions];
    this.filledPositions = [...this.filledPositions];
  }

}
