import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { EmojiService } from 'src/app/services/emoji.service';

@Component({
  selector: 'app-emoji-picker',
  templateUrl: './emoji-picker.component.html',
  styleUrl: './emoji-picker.component.scss'
})
export class EmojiPickerComponent {

  // dependencies
  // --------------------------------------------
  emoji = inject(EmojiService);
  data = inject(MAT_DIALOG_DATA);

}
