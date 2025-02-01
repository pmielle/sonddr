import { BreakpointObserver } from '@angular/cdk/layout';
import { Injectable, OnDestroy, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subject, Subscription, debounceTime, fromEvent } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ScreenSizeService implements OnDestroy {

  // dependencies
  // --------------------------------------------
  breakpoints = inject(BreakpointObserver);

  // i/o
  // --------------------------------------------
  // ...

  // attributes
  // --------------------------------------------
  static mobileMediaQuery = '(max-width: 500px)';
  static wideMediaQuery = '(min-width: 900px)';
  isMobile$ = new BehaviorSubject<boolean>(this.checkIsMobile());
  isWide$ = new BehaviorSubject<boolean>(this.checkIsWide());
  keyboard$ = new Subject<"open"|"closed">();
  resize$: Observable<Event>;
  // keep in sync with scss styles
  previousHeightDiff: number = 0;
  breakpointSub?: Subscription;
  resizeSub?: Subscription;

  // lifecycle hooks
  // --------------------------------------------
  constructor() {
    this.resize$ = fromEvent(window.visualViewport!, "resize").pipe(debounceTime(300));
    // listen to viewport resize
    this.resizeSub = this.resize$.subscribe(() => {
      this.onViewportResize();
    });
    // listen to breakpoints
    this.breakpointSub = this.breakpoints.observe(
      [ScreenSizeService.mobileMediaQuery, ScreenSizeService.wideMediaQuery]
    ).subscribe(() => {
      this.isMobile$.next(this.checkIsMobile());
      this.isWide$.next(this.checkIsWide());
    });
  }

  ngOnDestroy(): void {
    this.breakpointSub?.unsubscribe();
    this.resizeSub?.unsubscribe();
  }

  // methods
  // --------------------------------------------
  onViewportResize() {
    if (!this.checkIsMobile()) { return; }
    const hDiff = this.checkHeightDiff();
    // let's say a soft keyboard is at least 200px
    if (hDiff < this.previousHeightDiff - 200) {
      this.keyboard$.next("closed");
    } else if (hDiff > this.previousHeightDiff + 200) {
      this.keyboard$.next("open");
    }
    // save value for next time
    this.previousHeightDiff = hDiff;
  }

  // difference between the window height and the viewport
  // when the keyboard opens, this difference spikes
  // when it closes, it reduces
  checkHeightDiff(): number {
    return window.screen.height - window.visualViewport!.height;
  }

  checkIsMobile(): boolean {
    return this.breakpoints.isMatched(ScreenSizeService.mobileMediaQuery);
  }

  checkIsWide(): boolean {
    return this.breakpoints.isMatched(ScreenSizeService.wideMediaQuery);
  }

}
