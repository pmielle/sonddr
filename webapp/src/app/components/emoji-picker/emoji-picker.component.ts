import { Component, inject } from '@angular/core';
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

}
