import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { FabMode, MainNavService } from 'src/app/services/main-nav.service';
import { ScreenSizeService } from 'src/app/services/screen-size.service';

@Component({
  selector: 'app-fab',
  templateUrl: './fab.component.html',
  styleUrls: ['./fab.component.scss'],
})
export class FabComponent implements OnInit, OnDestroy {

  // dependencies
  // --------------------------------------------
  screen = inject(ScreenSizeService);
  mainNav = inject(MainNavService);

  // attributes
  // --------------------------------------------
  displayedMode?: FabMode = undefined;
  fabModeSub?: Subscription;
  hidden = true;
  updating = false;

  // lifecycle hooks
  // --------------------------------------------
  constructor() {
  }

  ngOnInit(): void {
    this.fabModeSub = this.mainNav.fabMode$.subscribe((mode) => {
      if (! mode) {
        this.hidden = true;
        // do not update the displayedMode: previous one simply goes out of sight
        return;
      }
      if (!this.hidden && mode !== this.displayedMode) {
        this.updating = true;
        setTimeout(() => {
          this.updating = false;
          this.displayedMode = mode;
        }, 300);
      } else {
      this.displayedMode = mode;
      }

      this.hidden = false;
    });
  }

  ngOnDestroy(): void {
    this.fabModeSub?.unsubscribe();
  }

  // methods
  // --------------------------------------------
  // ...

}
