import { ChangeDetectorRef, Directive, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription, fromEvent, switchMap, tap } from 'rxjs';
import { ScreenSizeService } from '../services/screen-size.service';
import { MainNavService } from '../services/main-nav.service';

@Directive({
  selector: '[appAboveKeyboard]',
})
export class AboveKeyboardDirective implements OnInit, OnDestroy {

  screen = inject(ScreenSizeService);
  detector = inject(ChangeDetectorRef);
  ele = inject(ElementRef);
  mainNav = inject(MainNavService);

  keyboardSub?: Subscription;
  initialHeight = window.visualViewport!.height;
  initialPosition = "";

  constructor() { }

  ngOnInit(): void {
    this.keyboardSub = this.screen.keyboard$.pipe(
      tap((state) => {
        if (state === "open") {
          this.initialPosition = (this.ele.nativeElement as HTMLElement).style.position;
          (this.ele.nativeElement as HTMLElement).style.position = "fixed";
          this.refreshBottom();
        } else {
          (this.ele.nativeElement as HTMLElement).style.position = this.initialPosition;
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
    this.detector.detectChanges();
  }

}
