import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { Discussion, Message, User, Change, isChange } from 'sonddr-shared';
import { HttpService } from 'src/app/services/http.service';
import { MainNavService } from 'src/app/services/main-nav.service';
import { ScreenSizeService } from 'src/app/services/screen-size.service';
import { ChatRoom } from 'src/app/types/chat-room';
import { WebsocketService } from 'src/app/services/websocket.service';
import { UserDataService } from 'src/app/services/user-data.service';


@Component({
  selector: 'app-discussion-view',
  templateUrl: './discussion-view.component.html',
  styleUrls: ['./discussion-view.component.scss']
})
export class DiscussionViewComponent implements OnInit, OnDestroy {

  // dependencies
  // --------------------------------------------
  route = inject(ActivatedRoute);
  http = inject(HttpService);
  screen = inject(ScreenSizeService);
  userData = inject(UserDataService);
  mainNav = inject(MainNavService);
  websocket = inject(WebsocketService);

  // attributes
  // --------------------------------------------
  routeSub?: Subscription;
  discussion?: Discussion;
  messages?: Message[];
  content: string = "";
  chatRoom?: ChatRoom;
  chatRoomSub?: Subscription;
  smallButton = false;

  // lifecycle hooks
  // --------------------------------------------
  ngOnInit(): void {
    this.mainNav.hideNavBar();
    this.routeSub = this.route.paramMap.subscribe(async map => {
      const id = map.get("id");
      if (!id) { throw new Error("Missing id route param"); }
      await this.http.getDiscussion(id).then(d => this.discussion = d); // needs to be await-ed otherwise scrollToBottom does not work
      this.chatRoom = await this.websocket.getChatRoom(id);
      this.chatRoomSub = this.chatRoom.listen().subscribe(
        (data) => this.onChatRoomUpdate(data)
      );
    });
    this.mainNav.disableFullScreenOnScroll();
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.chatRoomSub?.unsubscribe();
  }

  // methods
  // --------------------------------------------
  onChatRoomUpdate(data: Message[]|Change<Message>) {
    if (isChange(data)) {
      const change = data as Change<Message>;
      switch (change.type) {
        case "insert": {
          this.messages!.unshift(change.docAfter!);
          this.mainNav.scrollToBottom();
          break;
        }
        case "update": {
          const index = this.findIndex(change.docId);
          this.messages![index] = change.docAfter!;
          break;
        }
        case "delete": {
          const index = this.findIndex(change.docId);
          this.messages!.splice(index, 1);
          break;
        }
      }
    } else {
      this.messages = data as Message[];
      setTimeout(() => this.mainNav.scrollToBottom(), 0);
    }
  }

  findIndex(id: string): number {
    const index = this.messages!.findIndex(m => m.id === id);
    if (index === -1) { throw new Error(`Failed to find message ${id}`); }
    return index;
  }

  formIsValid() {
    return (this.content.length && this.discussion) ? true : false;
  }

  send() {
    if (! this.formIsValid()) {
      throw new Error("send() should not be callable if content is empty");
    }
    // post the message asynchronously
    const placeholder = this.chatRoom!.send(this.content);
    // add a placeholder message while waiting for the real one
    this.messages!.unshift(placeholder);
    // scroll to the bottom and reset the input
    this.mainNav.scrollToBottom();
    this.content = "";
  }

  react(emoji: string|undefined, messageId: string) {
    if (emoji) {
      this.chatRoom!.react(emoji, messageId);
    } else {
      this.chatRoom!.deleteReaction(messageId);
    }
  }

  delete(messageId: string) {
    this.chatRoom!.delete(messageId);
  }

  shouldHaveSpacer(i: number): boolean {
    const message = this.messages![i];
    const previousMessage = this.messages?.[i - 1];
    if (!previousMessage) { return false; }
    const fromSameAuthor = message.author.id === previousMessage.author.id;
    return !fromSameAuthor;
  }

  findOtherUser(): User|undefined {
    if (!this.discussion) { return undefined; }
    let otherUsers = this.discussion.users.filter(u => !u.isUser);
    if (!otherUsers.length) {
      throw new Error(`Failed to find another user for discussion ${this.discussion.id}`);
    }
    if (otherUsers.length > 1) {
      console.warn("Display of more than 1 other user is not yet supported: using the first one");
    }
    return otherUsers[0];
  }

}
