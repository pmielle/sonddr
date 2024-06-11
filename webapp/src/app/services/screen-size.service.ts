import { BreakpointObserver } from '@angular/cdk/layout';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ScreenSizeService {

  // dependencies
  // --------------------------------------------
  breakpoints = inject(BreakpointObserver);


  // attributes
  // --------------------------------------------
  mobileMediaQuery = '(max-width: 500px)';  // keep in sync with scss styles
  isMobile$ = new BehaviorSubject<boolean>(this.checkIsMobile());


  // lifecycle hooks
  // --------------------------------------------
  constructor() {
    this.breakpoints.observe(this.mobileMediaQuery).subscribe(() => {
      this.isMobile$.next(this.checkIsMobile());
    });
  }


  // methods
  // --------------------------------------------
  checkIsMobile(): boolean {
    return this.breakpoints.isMatched(this.mobileMediaQuery);
  }

}
