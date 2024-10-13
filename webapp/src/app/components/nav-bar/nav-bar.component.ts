import { Component, inject } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
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
  auth = inject(AuthService);

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
    // this tab is already active
    if (this.mainNav.tab$.getValue() === tab) {
      if (this.mainNav.atTabRoot$.getValue()) {
        this.mainNav.scrollToTop(true);
      } else {
          this.mainNav.goToTab(tab);
      }
    // else, coming from another tab
    } else {
        this.mainNav.goToTab(tab, true);
    }
  }

}
