import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-add-external-link-popup',
  templateUrl: './add-external-link-popup.component.html',
  styleUrl: './add-external-link-popup.component.scss'
})
export class AddExternalLinkPopupComponent {
  data = inject(MAT_DIALOG_DATA);
  value = "";
}
