import { Component, inject } from '@angular/core';
import { MainNavService, Tab } from 'src/app/services/main-nav.service';
import { ScreenSizeService } from 'src/app/services/screen-size.service';
import { UserDataService } from 'src/app/services/user-data.service';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss']
})
export class NavBarComponent {

  mainNav = inject(MainNavService);
  screen = inject(ScreenSizeService);
  userData = inject(UserDataService);

  // lifecycle hooks
  // --------------------------------------------
  // ...

  // attributes
  // --------------------------------------------
  makeBadge(n: number): string|undefined {
    if (n === 0) {
      return undefined;
    } else if (n <= 99) {
      return `${n}`;
    } else {
      return "99+";
    }
  }

  onClick(tab: Tab) {
    if (this.mainNav.tab$.getValue() === tab) {
      if (this.mainNav.atTabRoot$.getValue()) {
        this.mainNav.scrollToTop(true);
      } else {
        this.mainNav.goToTab(tab);
      }
    } else {
      this.mainNav.goToTab(tab);
    }
  }

}
