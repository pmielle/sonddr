import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Message } from 'sonddr-shared';
import { HttpService } from 'src/app/services/http.service';
import { ScreenSizeService } from 'src/app/services/screen-size.service';

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss']
})
export class MessageComponent {

  // dependencies
  // --------------------------------------------
  screen = inject(ScreenSizeService);
  http = inject(HttpService);

  // I/O
  // --------------------------------------------
  @Input("message") message?: Message;
  @Output("delete") delete = new EventEmitter<void>();
  @Output("react") react = new EventEmitter<string>();

  onReactClick() {
    let emoji = "heart";
    if (this.message?.userReaction) {
      console.log("already reacted...");
    } else {
      this.react.next(emoji);
    }
  }
}
