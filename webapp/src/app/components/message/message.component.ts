import { Component, EventEmitter, Input, OnDestroy, Output, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { Message } from 'sonddr-shared';
import { EmojiService } from 'src/app/services/emoji.service';
import { HttpService } from 'src/app/services/http.service';
import { ScreenSizeService } from 'src/app/services/screen-size.service';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss']
})
export class MessageComponent implements OnDestroy {

  // dependencies
  // --------------------------------------------
  screen = inject(ScreenSizeService);
  http = inject(HttpService);
  emoji = inject(EmojiService);
  dialog = inject(MatDialog);

  // I/O
  // --------------------------------------------
  @Input("message") message?: Message;
  @Output("delete") delete = new EventEmitter<void>();
  @Output("react") react = new EventEmitter<string|undefined>();

  // attributes
  // --------------------------------------------
  popupSub?: Subscription;

  // lifecycle hooks
  // --------------------------------------------
  ngOnDestroy(): void {
    this.popupSub?.unsubscribe;
  }

  // methods
  // --------------------------------------------
  onReactClick() {
    this.popupSub = this.dialog.open(EmojiPickerComponent, {panelClass: "custom-popup", data: {selected: this.message?.userReaction}})
    .afterClosed().subscribe(emoji => {
      if (emoji) {
        if (emoji === this.message?.userReaction) {
          this.react.next(undefined);
          return;
        }
        this.react.next(emoji);
      }
    });
  }
}
