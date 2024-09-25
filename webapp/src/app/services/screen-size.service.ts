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
  wideMediaQuery = '(min-width: 900px)';
  isMobile$ = new BehaviorSubject<boolean>(this.checkIsMobile());
  isWide$ = new BehaviorSubject<boolean>(this.checkIsWide());


  // lifecycle hooks
  // --------------------------------------------
  constructor() {
    this.breakpoints.observe([this.mobileMediaQuery, this.wideMediaQuery]).subscribe(() => {
      this.isMobile$.next(this.checkIsMobile());
      this.isWide$.next(this.checkIsWide());
    });
  }


  // methods
  // --------------------------------------------
  checkIsMobile(): boolean {
    return this.breakpoints.isMatched(this.mobileMediaQuery);
  }

  checkIsWide(): boolean {
    return this.breakpoints.isMatched(this.wideMediaQuery);
  }

}
