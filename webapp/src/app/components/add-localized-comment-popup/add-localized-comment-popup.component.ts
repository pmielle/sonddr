import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UserDataService } from 'src/app/services/user-data.service';

@Component({
  selector: 'app-add-localized-comment-popup',
  templateUrl: './add-localized-comment-popup.component.html',
  styleUrl: './add-localized-comment-popup.component.scss'
})
export class AddLocalizedCommentPopupComponent {

  userData = inject(UserDataService);
  data = inject(MAT_DIALOG_DATA);
  value = "";

}
