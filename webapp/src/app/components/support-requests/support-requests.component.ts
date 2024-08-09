import { Component, EventEmitter, Output, Input, inject, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { Volunteer } from 'sonddr-shared';
import { AddVolunteerPopupComponent } from '../add-volunteer-popup/add-volunteer-popup.component';

@Component({
  selector: 'app-support-requests',
  templateUrl: './support-requests.component.html',
  styleUrl: './support-requests.component.scss'
})
export class SupportRequestsComponent implements OnDestroy {

  dialog = inject(MatDialog);

  @Input('volunteers') volunteers?: Volunteer[];
  @Input('is-logged-in-user') isLoggedInUser?: boolean;
  @Output('add-volunteer') addVolunteer = new EventEmitter<string>();
  @Output('add-financing') addFinancing = new EventEmitter();

  popupSub?: Subscription;

  ngOnDestroy(): void {
      this.popupSub?.unsubscribe();
  }

  openFinancingPopup() {
    console.log("TODO");
  }

  countUnattributedVolunteers() {
    return this.volunteers!.reduce((sum, current) => current.user === undefined ? sum : sum + 1, 0);
  }

  openVolunteerPopup() {
    const dialogRef = this.dialog.open(AddVolunteerPopupComponent);
    this.popupSub = dialogRef.afterClosed().subscribe((description) => {
      if (description) {
        this.addVolunteer.next(description);
      }
    });
  }

}
