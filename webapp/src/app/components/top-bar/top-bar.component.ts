import { Component, Input, inject } from '@angular/core';
import { Location } from '@angular/common';
import { ScreenSizeService } from 'src/app/services/screen-size.service';
import { ColorService } from 'src/app/services/color.service';
import { MainNavService } from 'src/app/services/main-nav.service';
import { Router } from '@angular/router';

type LeftItem = "back" | "close" | "logo" | "close_home";

@Component({
  selector: 'app-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.scss']
})
export class TopBarComponent {

  // dependencies
  // --------------------------------------------
  screen = inject(ScreenSizeService);
  location = inject(Location);
  color = inject(ColorService);
  mainNav = inject(MainNavService);
  router = inject(Router);

  // i/o
  // --------------------------------------------
  @Input("left-item") leftItem?: LeftItem;
  @Input("background-color") backgroundColor: string = "#303030";  // has to be hardcoded hex because colorservice
  @Input("reverse-scroll") reverseScroll = false;
  @Input("opaque") opaque = false;

  // attributes
  // --------------------------------------------
  stuck = false;

  // methods
  // --------------------------------------------
  goBack() {
    if (this.mainNav.navigated) {
      this.location.back();
    } else {
      this.goHome();
    }
  }

  goHome() {
    this.mainNav.navigateTo("/");
  }

  onClick(e: Event) {
    // mat menu does not stopPropagation
    if ((e.target as Element).tagName === "SPAN") { return; }
    if (this.reverseScroll) {
      this.mainNav.scrollToBottom(true);
    } else {
      this.mainNav.scrollToTop(true);
    }
  }

}
