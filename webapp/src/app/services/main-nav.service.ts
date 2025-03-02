import { EventEmitter, Injectable, OnDestroy, inject } from '@angular/core';
import { NavigationEnd, Router, NavigationStart, NavigationBehaviorOptions } from '@angular/router';
import { BehaviorSubject, Subscription } from 'rxjs';
import { AuthService } from './auth.service';
import { TranslationService } from './translation.service';
import { ScreenSizeService } from './screen-size.service';

export type Tab = "ideas" | "search" | "messages" | "notifications";
export type FabMode = {
  icon: string,
  color: string,
  label?: string,
  action: () => void,
};

@Injectable({
  providedIn: 'root'
})
export class MainNavService implements OnDestroy {

  // dependencies
  // --------------------------------------------
  router = inject(Router);
  auth = inject(AuthService);
  i18n = inject(TranslationService);
  screen = inject(ScreenSizeService);

  // i/o
  // --------------------------------------------
  // ...

  // attributes
  // --------------------------------------------
  static defaultTopValue = 350;
  tab$ = new BehaviorSubject<Tab|undefined>(undefined);
  atTabRoot$ = new BehaviorSubject<boolean|undefined>(undefined);
  fabMode$ = new BehaviorSubject<FabMode|undefined>(undefined);
  fullScreen$ = new BehaviorSubject<boolean>(false);
  halfFullScreen$ = new BehaviorSubject<boolean>(false);
  fabClick$ = new EventEmitter<void>();
  isNavBarHidden = false;
  isNavBarFlat = false;
  isFabHidden = false;
  isFabDisabled = false;
  navigated = false;
  topValue = MainNavService.defaultTopValue;
  previousScroll = 0;
  ignoreScroll = false;
  fullScreenOnScroll = true;
  keyboardSub?: Subscription;
  routerSub?: Subscription;

  // lifecycle hooks
  // --------------------------------------------
  updateStatusBarColor(color: string) {
    document.querySelector("meta[name=theme-color]")!.setAttribute("content", `${color}`);
  }

  constructor() {
    this.routerSub = this.router.events.subscribe(
      (e) => {
        if (e instanceof NavigationEnd) {
          this.onNavigationEnd(e);
        } else if (e instanceof NavigationStart) {
          this.onNavigationStart();
        }
      }
    );

    // listen to software keyboard state
    this.keyboardSub = this.screen.keyboard$.subscribe((state) => {
      if (state == "closed") {
        this.ignoreScroll = false;
        this.halfFullScreen$.next(false);
        this.showFab();
      } else if (state == "open") {
        this.ignoreScroll = true;
        this.halfFullScreen$.next(true);
        this.hideFab();
      }
    });

  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.keyboardSub?.unsubscribe();
    this.restoreAll();
  }

  // methods
  // --------------------------------------------
  navigateTo(url: string, logInRequired: boolean = false, navigationOptions: NavigationBehaviorOptions|undefined = undefined) {
    if (logInRequired && !this.auth.isLoggedIn()) {
      this.auth.openAuthSnack();
      return;
    }
    this.router.navigateByUrl(url, navigationOptions);
  }

  goToTab(tab: Tab, logInRequired: boolean = false, navigationOptions: NavigationBehaviorOptions|undefined = undefined) {
    this.navigateTo(`/${tab}`, logInRequired, navigationOptions);
  }

  onNavigationStart() {
    this.restoreAll();
  }

  onNavigationEnd(e: NavigationEnd) {
    this.navigated = e.id > 1;
    const url = e.urlAfterRedirects;
    this.updateAtTabRoot(url);
    this.updateTab(url);
  }

  // settimeout to avoid race conditions
  scrollToBottom(smooth: boolean = false) {
    setTimeout(() => {
      const tabs = document.getElementById("tabs");
      tabs?.scrollTo({
        top: 999999,
        left: 0,
        behavior: smooth ? "smooth" : "instant"
      });
    }, 100);
  }

  // settimeout to avoid race conditions
  scrollToTop(smooth: boolean = false) {
    setTimeout(() => {
      const tabs = document.getElementById("tabs");
      tabs?.scrollTo({
        top: 0,
        left: 0,
        behavior: smooth ? "smooth" : "instant"
      });
    }, 100);
  }

  onScroll(el: Element) {
    if (this.ignoreScroll || !this.fullScreenOnScroll) { return }
    if (el.scrollTop < this.topValue) {
      if (this.fullScreen$.getValue() === true ) { this.fullScreen$.next(false); }
    } else if (el.scrollTop + el.clientHeight > el.scrollHeight - 100) {
      if (this.fullScreen$.getValue() === true) { this.fullScreen$.next(false); }
    } else if (this.previousScroll > el.scrollTop) {
      if (this.fullScreen$.getValue() === true) { this.fullScreen$.next(false); }
    } else if (this.previousScroll < el.scrollTop) {
      if (this.fullScreen$.getValue() === false) { this.fullScreen$.next(true); }
    }
    this.previousScroll = el.scrollTop;
  }

  updateAtTabRoot(url: string) {
    this.atTabRoot$.next(
      ["/ideas", "/search", "/messages", "/notifications"].includes(url)
    );
  }

  updateTab(url: string) {
    if (url.startsWith("/ideas")) {
      this.tab$.next("ideas");
    } else if (url.startsWith("/search")) {
      this.tab$.next("search");
    }else if (url.startsWith("/messages")) {
      this.tab$.next("messages");
    } else if (url.startsWith("/notifications")) {
      this.tab$.next("notifications");
    } else {
      console.error(`cannot select tab: ${url} is not an exepected url`);
      this.tab$.next(undefined);
    }
  }

  setFab(mode: FabMode|undefined) {
    this.fabMode$.next(mode);
  }

  // views can temporarily hide stuff:
  // restore everything back to its original state
  restoreAll() {
    this.restoreNavBar();
    this.restoreFab();
    this.restoreScroll();
    this.restoreStatusBar();
  }

  restoreStatusBar() {
    this.updateStatusBarColor("#303030");
  }

  restoreScroll() {
    this.ignoreScroll = false;
    this.fullScreenOnScroll = true;
    this.previousScroll = 0;
    this.resetTopValue();
  }

  restoreNavBar() {
    this.isNavBarFlat = false;
    this.showNavBar();
  }

  restoreFab() {
    this.setFab(undefined);
    this.enableFab();
    this.isFabHidden = false;
  }

  disableFullScreenOnScroll() {
    this.fullScreenOnScroll = false;
  }

  resetTopValue() {
    this.topValue = MainNavService.defaultTopValue;
  }

  hideNavBar() {
    this.isNavBarHidden = true;
  }

  showNavBar() {
    this.isNavBarHidden = false;
  }

  flattenNavBar() {
    this.isNavBarFlat = true;
  }

  hideFab() {
    this.isFabHidden = true;
  }

  showFab() {
    this.isFabHidden = false;
  }

  enableFab() {
    this.isFabDisabled = false;
  }

  disableFab() {
    this.isFabDisabled = true;
  }

}
