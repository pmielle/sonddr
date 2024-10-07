import { EventEmitter, Injectable, OnDestroy, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, Subscription, filter } from 'rxjs';
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
  constructor() {
    this.routerSub = this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(
      (e) => this.onRouteChange(e as NavigationEnd)
    );

    // listen to software keyboard state
    this.keyboardSub = this.screen.keyboard$.subscribe((state) => {
      if (state == "closed") {
        this.ignoreScroll = false;
        this.halfFullScreen$.next(false);
        this.showFab();
      } else if (state == "open") {
        this.ignoreScroll = true;
        setTimeout(() => {
          this.halfFullScreen$.next(true);
          this.hideFab();
        }, 100);
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
  goToTab(tab: Tab) {
    this.router.navigateByUrl(`/${tab}`);
  }

  scrollToBottom(smooth: boolean = false) {
    const tabs = document.getElementById("tabs");
    tabs?.scrollTo({
      top: 999999,
      left: 0,
      behavior: smooth ? "smooth" : "instant"
    });
  }

  scrollToTop(smooth: boolean = false) {
    const tabs = document.getElementById("tabs");
    tabs?.scrollTo({
      top: 0,
      left: 0,
      behavior: smooth ? "smooth" : "instant"
    });
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

  onRouteChange(e: NavigationEnd) {
    const url = e.urlAfterRedirects;
    this.restoreAll();
    this.updateAtTabRoot(url);
    this.updateTab(url);
    setTimeout(() => {
      this.updateFab(url);
    }, 100);
    this.navigated = e.id > 1;
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

  updateFab(url: string) {
    if (url === "/ideas") {
      this.fabMode$.next({
        icon: "add",
        color: "var(--primary-color)",
        label: this.i18n.get("fab.share-an-idea"),
        action: () => {this.router.navigateByUrl("/ideas/add")}
      });
    } else if (url.startsWith("/ideas/goal/")) {
      const goalId = url.split(/\//)[3];
      this.fabMode$.next({
        icon: "add",
        color: "var(--primary-color)",
        label: this.i18n.get("fab.share-an-idea"),
        action: () => {this.router.navigateByUrl(`/ideas/add?preselected=${goalId}`)}
      });
    }  else if (url === "/messages") {
      this.fabMode$.next({
        icon: "add",
        color: "var(--blue)",
        label: this.i18n.get("fab.start-a-discussion"),
        action: () => {this.router.navigateByUrl(`/messages/new-discussion`)}
      });
    } else if (url.startsWith("/ideas/add")) {
      const label = url.includes("edit=") ? this.i18n.get("fab.done") : this.i18n.get("fab.share");
      this.fabMode$.next({
        icon: "done",
        color: "var(--green)",
        label: label,
        action: () => {this.fabClick$.next();}
      });
    } else if (url.startsWith("/ideas/user-edit/")) {
      this.fabMode$.next({
        icon: "done",
        color: "var(--green)",
        label: this.i18n.get("fab.done"),
        action: () => {this.fabClick$.next();}
      });
    } else if (url.startsWith("/ideas/volunteers/")) {
      this.fabMode$.next(undefined); // handled by the view depending on who the user is
    } else if (url.startsWith("/ideas/user/")) {
      this.fabMode$.next(undefined); // handled by the view depending on who the user is
    } else if (url.startsWith("/ideas/idea/")) {
      this.fabMode$.next(undefined); // handled by the view depending on who the user is
    }else if (url.startsWith("/messages/new-discussion")) {
      this.fabMode$.next(undefined);
    } else if (url.startsWith("/messages/discussion/")) {
      this.fabMode$.next(undefined);
    } else if (url === "/notifications") {
      this.fabMode$.next(undefined);
    } else if (url === "/search") {
      this.fabMode$.next(undefined);
    } else if (url === "/") {
      this.fabMode$.next(undefined);
    } else if (url.startsWith("/ideas/details/")) {
      this.fabMode$.next(undefined);
    } else {
      console.error(`cannot set fab mobe: ${url} is not an exepected url`);
      this.fabMode$.next(undefined);
    }
  }

  setCheerFab() {
    this.fabMode$.next({
      icon: "favorite_outline",
      color: "var(--primary-color)",
      label: this.i18n.get("fab.cheer"),
      action: () => {this.fabClick$.next();}
    });
  }

  setHasCheeredFab() {
    this.fabMode$.next({
      icon: "favorite",
      color: "var(--primary-color)",
      label: "✅",
      action: () => {this.fabClick$.next();}
    });
  }

  setAddVolunteerFab() {
    this.fabMode$.next({
      icon: "add",
      color: "var(--primary-color)",
      label: this.i18n.get("fab.request"),
      action: () => {this.fabClick$.next();}
    });
  }

  setOtherUserFab(userId: string) {
    this.fabMode$.next({
        icon: "add",
        color: "var(--blue)",
        label: this.i18n.get("fab.send-a-message"),
        action: () => {this.router.navigateByUrl(`/messages/new-discussion?preselected=${userId}`)}
    });
  }

  setLoggedInUserFab() {
    this.fabMode$.next({
        icon: "logout",
        color: "var(--red)",
        label: this.i18n.get("fab.log-out"),
        action: () => { this.auth.logOut(); }
    });
  }

  setUndefinedFab() {
    this.fabMode$.next(undefined);
  }

  // views can temporarily hide stuff:
  // restore everything back to its original state
  restoreAll() {
    this.restoreNavBar();
    this.restoreFab();
    this.restoreScroll();
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
