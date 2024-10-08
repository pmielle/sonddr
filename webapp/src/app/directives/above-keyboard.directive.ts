import { Directive, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { Subscription, filter } from 'rxjs';
import { ScreenSizeService } from '../services/screen-size.service';

@Directive({
  selector: '[appAboveKeyboard]',
})
export class AboveKeyboardDirective implements OnInit, OnDestroy {

  // dependencies
  // --------------------------------------------
  screen = inject(ScreenSizeService);
  ele = inject(ElementRef);

  // i/o
  // --------------------------------------------
  // by default, root is the element the directive is applied to
  // but sometimes the actual input element is not inside the thing we want to pin above the keyboard
  // in these cases, set root to the parent (or the elem itself) of the associated input
  // e.g. the editor toolbar
  @Input('root') root: HTMLElement = this.ele.nativeElement;
  @Output('open') open = new EventEmitter<void>();
  @Output('close') close = new EventEmitter<void>();

  // attributes
  // --------------------------------------------
  keyboardSub?: Subscription;
  // initial screen size, before soft keyboard opens
  fullHeight = window.visualViewport!.height;
  // initial* properties are overriden when pinning,
  // and then restored to their original values when unpinning
  initialPosition = "";
  initialZIndex = "";
  initialBottom = "";
  // the element to pin might have the "frosted" class already
  // if so, do not remove it when unpinning
  hasFrosted = false;

  // lifecycle hooks
  // --------------------------------------------
  constructor() { }

  ngOnInit(): void {
    this.keyboardSub = this.screen.keyboard$.pipe(
      filter(() => this.checkShouldReact()),
    ).subscribe((state) => {
      if (state === "open") {
        this.onKeyboardOpen();
      } else {
        setTimeout(() => {
          this.onKeyboardClose();
        }, 100); // otherwise bottom is 0 sometimes
      }
    });
  }

  ngOnDestroy(): void {
    this.keyboardSub?.unsubscribe();
    this.stopReactingToScroll();
  }

  // methods
  // --------------------------------------------
  onKeyboardOpen() {
    let ele = (this.ele.nativeElement as HTMLElement);
    // override styles to pin the element
    // most styles are from a stylesheet,
    // so we need to use getComputedStyles to get them
    const styles = window.getComputedStyle(ele);
    this.initialPosition = styles.position;
    this.initialZIndex = styles.zIndex;
    this.initialBottom = styles.bottom;
    ele.style.position = "fixed";
    ele.style.zIndex = "999";
    this.hasFrosted = ele.classList.contains("frosted");
    if (!this.hasFrosted) { ele.classList.add("frosted"); }
    // react to scroll
    window.visualViewport!.onscroll = () => this.refreshBottom();
    // bubble up
    this.open.next();
    // pin it a first time
    // the same method will be called on scroll
    this.refreshBottom();
  }

  onKeyboardClose() {
    setTimeout(() => {
      let ele = (this.ele.nativeElement as HTMLElement);
      // restore the styles
      ele.style.position = this.initialPosition;
      ele.style.zIndex = this.initialZIndex;
      ele.style.bottom = this.initialBottom;
      if (!this.hasFrosted) {
        ele.classList.remove("frosted");
      }
      // stop reacting to scroll
      this.stopReactingToScroll();
      // bubble up
      this.close.next();
    }, 100); // do not restore scroll too early
  }

  stopReactingToScroll() {
    window.visualViewport!.onscroll = () => { };
  }

  // decide whether or not to react to a keyboard event:
  // if the element is or contains a focusable element,
  // make sure it is focused (and ignore if not)
  // this is useful if there are multiple input fields on the page
  checkShouldReact(): boolean {
    // the element itself can be focusable
    if (this.root === document.activeElement) { return true; }
    // if not, check its children
    let childrenInputs = Array.from(
      this.root.querySelectorAll("textarea, input, div[contenteditable=\"true\"]")
    );
    // if there is no focusable element, pin everytime
    if (!childrenInputs.length) {
      return true;
    }
    // check if a children has focus
    for (let t of childrenInputs) {
      if (t == document.activeElement) { return true; }
    }
    // do not pin if input elem exist but are not focused
    return false;
  }

  // hack to pin the elem right above the keyboard:
  // fullHeight is the screen size before the keyboard opens
  // visualViewport height and pageTop (offset) can be used to track stuff
  // when the soft keyboard is open
  refreshBottom() {
    const bottom = this.fullHeight - window.visualViewport!.height - window.visualViewport!.pageTop;
    (this.ele.nativeElement as HTMLElement).style.bottom = bottom + "px";
  }

}
