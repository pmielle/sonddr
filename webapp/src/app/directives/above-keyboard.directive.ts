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
  isPinned = false;

  // lifecycle hooks
  // --------------------------------------------
  constructor() { }

  ngOnInit(): void {
    this.keyboardSub = this.screen.keyboard$.subscribe((state) => {
      if (state === "open" && this.checkShouldPin()) {
        if (this.checkShouldPin()) {
          this.onKeyboardOpen();
        }
      } else {
        if (this.isPinned) {
          this.onKeyboardClose();
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.keyboardSub?.unsubscribe();
    this.stopReactingToScroll();
  }

  // methods
  // --------------------------------------------
  // decide whether or not to react to a keyboard event:
  // if the element is or contains a focusable element,
  // make sure it is focused (and ignore if not)
  // this is useful if there are multiple input fields on the page
  checkShouldPin(): boolean {
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

  onKeyboardOpen() {
    this.save();
    this.override();
    this.open.next();
    // pin it a first time
    // the same method will be called on scroll
    this.refreshBottom();
  }

  save() {
    this.isPinned = true;
    let ele = (this.ele.nativeElement as HTMLElement);
    const styles = window.getComputedStyle(ele);
    this.initialPosition = styles.position;
    this.initialZIndex = styles.zIndex;
    this.initialBottom = styles.bottom;
  }

  override() {
    let ele = (this.ele.nativeElement as HTMLElement);
    // override styles to pin the element
    // most styles are from a stylesheet,
    // so we need to use getComputedStyles to get them
    ele.style.position = "fixed";
    ele.style.zIndex = "999";
    this.hasFrosted = ele.classList.contains("frosted");
    if (!this.hasFrosted) { ele.classList.add("frosted"); }
    // react to scroll
    window.visualViewport!.onscroll = () => this.refreshBottom();
  }

  // hack to pin the elem right above the keyboard:
  // fullHeight is the screen size before the keyboard opens
  // visualViewport height and pageTop (offset) can be used to track stuff
  // when the soft keyboard is open
  refreshBottom() {
    const bottom = this.fullHeight - window.visualViewport!.height - window.visualViewport!.pageTop;
    (this.ele.nativeElement as HTMLElement).style.bottom = bottom + "px";
  }

  onKeyboardClose() {
    this.restore();
    this.reset();
    this.close.next();
  }

  restore() {
    // stop reacting to scroll
    this.stopReactingToScroll();
    // restore the styles
    let ele = (this.ele.nativeElement as HTMLElement);
    ele.style.position = this.initialPosition;
    ele.style.zIndex = this.initialZIndex;
    ele.style.bottom = this.initialBottom;
    if (!this.hasFrosted) {
      ele.classList.remove("frosted");
    }
  }

  reset() {
    this.isPinned = false;
    this.hasFrosted = false;
    this.initialBottom = "";
    this.initialZIndex = "";
    this.initialBottom = "";
  }

  stopReactingToScroll() {
    window.visualViewport!.onscroll = () => { };
  }

}
