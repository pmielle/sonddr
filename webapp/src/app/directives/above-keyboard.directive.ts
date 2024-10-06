import { Directive, ElementRef, EventEmitter, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { Subscription, filter, fromEvent, switchMap, tap } from 'rxjs';
import { ScreenSizeService } from '../services/screen-size.service';
import { MainNavService } from '../services/main-nav.service';

@Directive({
  selector: '[appAboveKeyboard]',
})
export class AboveKeyboardDirective implements OnInit, OnDestroy {

  screen = inject(ScreenSizeService);
  ele = inject(ElementRef);
  mainNav = inject(MainNavService);

  @Output('open') open = new EventEmitter<void>();
  @Output('close') close = new EventEmitter<void>();

  keyboardSub?: Subscription;
  initialHeight = window.visualViewport!.height;
  initialPosition = "";
  initialFrosted = false;
  initialZIndex = "";
  initialBottom = "";

  constructor() { }

  ngOnInit(): void {
    const styles = window.getComputedStyle(this.ele.nativeElement);
    this.initialFrosted = (this.ele.nativeElement as HTMLElement).classList.contains("frosted");
    this.initialPosition = styles.position;
    this.initialZIndex = styles.zIndex;
    this.initialBottom = styles.bottom;
    this.keyboardSub = this.screen.keyboard$.pipe(
      filter(() => this.multiInputFilter()),
      tap((state) => {
        let ele = this.ele.nativeElement as HTMLElement;
        if (state === "open") {
          ele.style.position = "fixed";
          ele.style.zIndex = "999";
          if (!this.initialFrosted) { ele.classList.add("frosted"); }
          this.refreshBottom();
          window.visualViewport!.onscroll = () => this.refreshBottom();
          this.open.next();
        } else {
          setTimeout(() => {
            ele.style.position = this.initialPosition;
            if (!this.initialFrosted) {
              ele.classList.remove("frosted");
            }
            ele.style.zIndex = this.initialZIndex;
            ele.style.bottom = this.initialBottom;
            window.visualViewport!.onscroll = () => { };
            this.close.next();
          }, 100); // otherwise bottom is 0 sometimes
        }
      }),
    ).subscribe(() => this.refreshBottom());
  }

  ngOnDestroy(): void {
    this.keyboardSub?.unsubscribe();
  }

  multiInputFilter(): boolean {
    if (this.ele.nativeElement === document.activeElement) { return true; }
    let childTextareas = Array.from((this.ele.nativeElement as HTMLElement).getElementsByTagName('textarea'));
    if (!childTextareas.length) { return true; }
    for (let t of childTextareas) {
      if (t == document.activeElement) { return true; }
    }
    return false;
  }

  refreshBottom() {
    const bottom = this.initialHeight - window.visualViewport!.height - window.visualViewport!.pageTop;
    (this.ele.nativeElement as HTMLElement).style.bottom = bottom + "px";
  }

}
