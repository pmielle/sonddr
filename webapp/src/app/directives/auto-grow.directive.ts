import { Directive, ElementRef, OnInit, inject } from '@angular/core';

@Directive({
  selector: '[appAutoGrow]',
})
export class AutoGrowDirective implements OnInit {

  // dependencies
  // --------------------------------------------
  ele = inject(ElementRef);

  // i/o
  // --------------------------------------------
  // ...

  // attributes
  // --------------------------------------------
  // ...

  // lifecycle hooks
  // --------------------------------------------
  constructor() {}

  ngOnInit(): void {
    let ele = (this.ele.nativeElement as HTMLTextAreaElement);
    console.log(ele);
    ele.rows = 1;
    this.setStyles(ele);
  }

  // methods
  // --------------------------------------------
  setStyles(ele: HTMLTextAreaElement) {
    ele.style.setProperty("field-sizing", "content");
    ele.style.maxHeight = "5lh";
  }

}
