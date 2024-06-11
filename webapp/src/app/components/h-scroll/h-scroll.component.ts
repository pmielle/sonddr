import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-h-scroll',
  templateUrl: './h-scroll.component.html',
  styleUrls: ['./h-scroll.component.scss']
})
export class HScrollComponent {

  // attributes
  // --------------------------------------------
  @Input('shadow-color') shadowColor: string = "var(--background-color)";
  @Input('hide-shadows') hideShadows: boolean = false;
  @Input('left-padding') leftPadding = "var(--gutter)";
  leftShadow = false;
  rightShadow = true;

  // lifecycle hooks
  // --------------------------------------------
  constructor() { }
  
  // methods
  // --------------------------------------------
  // ...

}