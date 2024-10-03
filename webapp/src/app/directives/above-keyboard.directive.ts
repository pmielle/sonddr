import { Directive, ElementRef, EventEmitter, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { Subscription, fromEvent, switchMap, tap } from 'rxjs';
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
  initialBackgroundColor = "";
  initialZIndex = "";

  constructor() { }

  ngOnInit(): void {
    this.keyboardSub = this.screen.keyboard$.pipe(
      tap((state) => {
        if (state === "open") {
          this.initialPosition = (this.ele.nativeElement as HTMLElement).style.position;
          this.initialBackgroundColor = (this.ele.nativeElement as HTMLElement).style.backgroundColor;
          this.initialZIndex = (this.ele.nativeElement as HTMLElement).style.zIndex;
          (this.ele.nativeElement as HTMLElement).style.position = "fixed";
          (this.ele.nativeElement as HTMLElement).style.zIndex = "999";
          (this.ele.nativeElement as HTMLElement).style.backgroundColor = "var(--background-color)";
          this.refreshBottom();
          this.open.next();
        } else {
          (this.ele.nativeElement as HTMLElement).style.position = this.initialPosition;
          (this.ele.nativeElement as HTMLElement).style.backgroundColor = this.initialBackgroundColor;
          (this.ele.nativeElement as HTMLElement).style.zIndex = this.initialZIndex;
          this.refreshBottom();
          this.close.next();
        }
      }),
      switchMap(() => fromEvent(window.visualViewport!, "scroll")),
    ).subscribe(() => this.refreshBottom());
  }

  ngOnDestroy(): void {
    this.keyboardSub?.unsubscribe();
    (this.ele.nativeElement as HTMLElement).style.position = this.initialPosition;
  }

  refreshBottom() {
    const bottom = this.initialHeight - window.visualViewport!.height - window.visualViewport!.pageTop;
    (this.ele.nativeElement as HTMLElement).style.bottom = bottom + "px";
  }

}
