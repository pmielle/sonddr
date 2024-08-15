import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { User, Volunteer } from 'sonddr-shared';
import { HttpService } from 'src/app/services/http.service';
import { MainNavService } from 'src/app/services/main-nav.service';
import { UserDataService } from 'src/app/services/user-data.service';

@Component({
  selector: 'app-volunteers-view',
  templateUrl: './volunteers-view.component.html',
  styleUrl: './volunteers-view.component.scss'
})
export class VolunteersViewComponent implements OnInit, OnDestroy {

  http = inject(HttpService);
  route = inject(ActivatedRoute);
  mainNav = inject(MainNavService);
  userData = inject(UserDataService);
  routeSub?: Subscription;
  openPositions: Volunteer[] = [];
  filledPositions: Volunteer[] = [];
  isAdmin: boolean = false;

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe((map) => {
      const id = map.get("id")!;
      this.http.getVolunteers(id).then(v => {
        this.setIsAdmin(v[0]);
        this.setVolunteers(v)
      });
    });
    setTimeout(() => this.mainNav.hideNavBar(), 100); // otherwise NG0100
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe;
    this.mainNav.showNavBar();
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
    this._updateOpenPosition(v);
  }

  onRemove(v: Volunteer) {
    this.http.removeVolunteerUser(v.id);
    v.user = undefined;
    this._openPosition(v);
  }

  onAccept(v: Volunteer, c: User) {
    this.http.acceptVolunteerCandidate(v.id, c.id);
    v.user = c;
    v.candidates = [];
    this._fillPosition(v);
  }

  onApply(v: Volunteer) {
    this.http.addVolunteerCandidate(v.id);
    const userId = this.userData.user$.getValue()!;
    v.candidates.push(userId);
    this._updateOpenPosition(v);
  }

  // any volunteer works
  setIsAdmin(volunteer: Volunteer) {
    this.isAdmin = volunteer.idea.author.isUser;
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

  _updateOpenPosition(v: Volunteer) {
    const i = this.openPositions.findIndex(volunteer => volunteer.id === v.id);
    this.openPositions[i] = v;
    this.openPositions = [...this.openPositions];
  }

  _openPosition(v: Volunteer) {
    const i = this.filledPositions.findIndex(volunteer => volunteer.id === v.id);
    this.filledPositions.splice(i, 1);
    this.openPositions.push(v);
    this.filledPositions = [...this.filledPositions];
    this.openPositions = [...this.openPositions];
  }

  _fillPosition(v: Volunteer) {
    const i = this.openPositions.findIndex(volunteer => volunteer.id === v.id);
    this.openPositions.splice(i, 1);
    this.filledPositions.push(v);
    this.openPositions = [...this.openPositions];
    this.filledPositions = [...this.filledPositions];
  }

}
