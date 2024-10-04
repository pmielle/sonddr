import { Directive, ElementRef, OnInit, inject } from '@angular/core';

@Directive({
  selector: '[appAutoGrow]',
})
export class AutoGrowDirective implements OnInit {

  ele = inject(ElementRef);

  constructor() {
  }

  ngOnInit(): void {
      (this.ele.nativeElement as HTMLTextAreaElement).rows = 1;
      (this.ele.nativeElement as HTMLTextAreaElement).classList.add("auto-grow");
  }

}
