import { BehaviorSubject, Observable } from "rxjs";
import { Change, Message, User, placeholder_id, delete_str, react_str, sep_str, delete_react_str } from "sonddr-shared";
import { Buffer } from "buffer";

export class ChatRoom {

  ws: WebSocket;
  user$: BehaviorSubject<User|undefined>;

  constructor(ws: WebSocket, user: BehaviorSubject<User|undefined>) {
    this.ws = ws;
    this.user$ = user;
  }

  listen(): Observable<Message[]|Change<Message>> {
    return new Observable<Message[]|Change<Message>>(subscriber => {
      this.ws.onmessage = (message: MessageEvent<string>) => {
        const data = JSON.parse(message.data, (key, value) => {
          if (/[Dd]ate$/.test(key)) {
            value = new Date(value);
          }
          return value;
        });
        subscriber.next(data);
      };
      this.ws.onerror = (e) => subscriber.error(e);
      return () => this.ws.close();
    });
  }

  async send(message: string, img?: File): Promise<Message> {
    let payload = message;
    if (img) {
      let img_base64 = Buffer
        .from(await img.arrayBuffer())
        .toString("base64");
      payload += `${sep_str}${img_base64}`;
    }
    this.ws.send(payload);
    return this._makePlaceholderMessage(message, img);
  }

  deleteReaction(messageId: string) {
    this.ws.send(`${delete_react_str}${sep_str}${messageId}`);
  }

  react(emoji: string, messageId: string) {
    this.ws.send(`${react_str}${sep_str}${messageId}${sep_str}${emoji}`);
  }

  delete(messageId: string) {
    this.ws.send(`${delete_str}${sep_str}${messageId}`);
  }


  // private
  // --------------------------------------------
  _makePlaceholderMessage(content: string, img?: File): Message {
    let placeholder: Message = {
      id: placeholder_id,
      discussionId: placeholder_id,
      content: content,
      author: this.user$.getValue()!,
      date: new Date(),
      deleted: false,
    };
    if (img) {
      placeholder.img = URL.createObjectURL(img);
    }
    return placeholder;
  }

}
