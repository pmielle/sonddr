import { Component, Input, inject } from '@angular/core';
import { User } from 'sonddr-shared';
import { HttpService } from 'src/app/services/http.service';

@Component({
  selector: 'app-profile-picture',
  templateUrl: './profile-picture.component.html',
  styleUrls: ['./profile-picture.component.scss']
})
export class ProfilePictureComponent {

  http = inject(HttpService);

  @Input('large') large = false;
  @Input('user') user?: User|null;
  @Input('override') override?: string;

  choosePicture() {
    return this.override
      ? this.override
      : this.user?.profilePicture
        ? `url(${this.http.getImageUrl(this.user.profilePicture)}`
        : "";
  }

}
