import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { ExternalLink, ExternalLinkType, externalLinkTypes } from 'sonddr-shared';
import { AddExternalLinkPopupComponent } from '../add-external-link-popup/add-external-link-popup.component';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-external-links',
  templateUrl: './external-links.component.html',
  styleUrl: './external-links.component.scss'
})
export class ExternalLinksComponent {

  // dependencies
  // --------------------------------------------
  dialog = inject(MatDialog);

  // I/O
  // --------------------------------------------
  @Input('external-links') externalLinks?: ExternalLink[];
  @Input('is-logged-in-user') isLoggedInUser?: boolean;
  @Output('delete') delete = new EventEmitter<ExternalLink>();
  @Output('add') add = new EventEmitter<ExternalLink>();

  // attributes
  // --------------------------------------------
  popupSub?: Subscription;

  // methods
  // --------------------------------------------
  chooseSelectableLinkTypes(): ExternalLinkType[] {
    if (! this.externalLinks) { return [] }
    return externalLinkTypes
      .filter(type => ! this.externalLinks!.map(el => el.type).includes(type as any));
  }

  deleteExternalLink(link: ExternalLink) {
    this.externalLinks = this.externalLinks!.filter(el => el.type !== link.type);
    this.delete.next(link);
  }

  addExternalLink(type: string) {
    const dialogRef = this.dialog.open(AddExternalLinkPopupComponent, { data: { type: type } });
    this.popupSub = dialogRef.afterClosed().subscribe((url) => {
      if (url) {
        const link: ExternalLink = {
          type: type as any,
          url: url,
        };
        this.add.next(link);
      }
    });
  }

}
