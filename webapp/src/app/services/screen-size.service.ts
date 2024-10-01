import { BreakpointObserver } from '@angular/cdk/layout';
import { Injectable, OnDestroy, inject } from '@angular/core';
import { BehaviorSubject, Subscription, debounceTime, fromEvent } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ScreenSizeService implements OnDestroy {

  // dependencies
  // --------------------------------------------
  breakpoints = inject(BreakpointObserver);


  // attributes
  // --------------------------------------------
  mobileMediaQuery = '(max-width: 500px)';  // keep in sync with scss styles
  wideMediaQuery = '(min-width: 900px)';
  isMobile$ = new BehaviorSubject<boolean>(this.checkIsMobile());
  isWide$ = new BehaviorSubject<boolean>(this.checkIsWide());
  keyboard$ = new BehaviorSubject<"open"|"closed">("closed");
  breakpointSub?: Subscription;
  resizeSub?: Subscription;
  previousHeightDiff = ScreenSizeService.checkHeightDiff();

  static checkHeightDiff(): number|undefined {
    if (window.visualViewport) {
      return window.screen.height - window.visualViewport.height;
    } else {
      return undefined;
    }
  }

  // lifecycle hooks
  // --------------------------------------------
  constructor() {
    this.breakpointSub = this.breakpoints.observe([this.mobileMediaQuery, this.wideMediaQuery]).subscribe(() => {
      this.isMobile$.next(this.checkIsMobile());
      this.isWide$.next(this.checkIsWide());
    });
    this.resizeSub = fromEvent(window, "resize").pipe(debounceTime(300)).subscribe(() => {
      const hDiff = ScreenSizeService.checkHeightDiff();
      if (hDiff === undefined) { return; }
      if (this.previousHeightDiff === undefined) { this.previousHeightDiff = hDiff; return; }
      // normal case
      if (hDiff < this.previousHeightDiff - 200) {
        this.keyboard$.next("closed");
      } else if (hDiff > this.previousHeightDiff + 200) {
        this.keyboard$.next("open");
      }
      // save value for next time
      this.previousHeightDiff = hDiff;
    });
  }

  ngOnDestroy(): void {
    this.breakpointSub?.unsubscribe();
    this.resizeSub?.unsubscribe();
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
