import { Component, Input, inject } from '@angular/core';
import { Discussion, User } from 'sonddr-shared';
import { TimeService } from 'src/app/services/time.service';
import { UserDataService } from 'src/app/services/user-data.service';

@Component({
  selector: 'app-discussion',
  templateUrl: './discussion.component.html',
  styleUrls: ['./discussion.component.scss']
})
export class DiscussionComponent {

  // dependencies
  // --------------------------------------------
  userData = inject(UserDataService);
  time = inject(TimeService);

  // I/O
  // --------------------------------------------
  @Input("discussion") discussion?: Discussion;

  // methods
  // --------------------------------------------
  findOtherUser(loggedInUser: User|undefined|null): User|undefined {
    if (!this.discussion) { return undefined; }
    if (!loggedInUser) { return undefined; }
    let otherUsers = this.discussion.users.filter(u => u.id !== loggedInUser.id);
    if (!otherUsers.length) {
      throw new Error(`Failed to find another user for discussion ${this.discussion.id}`);
    }
    if (otherUsers.length > 1) {
      console.warn("Display of more than 1 other user is not yet supported: using the first one");
    }
    return otherUsers[0];
  }

}
