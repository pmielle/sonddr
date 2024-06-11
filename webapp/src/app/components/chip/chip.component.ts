import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-chip',
  templateUrl: './chip.component.html',
  styleUrls: ['./chip.component.scss']
})
export class ChipComponent {

  // attributes
  // --------------------------------------------
  @Input('no-label') noLabel: boolean = false;
  @Input('label') label!: string|number;
  @Input('icon') icon!: string;
  @Input('color') color!: string;
  @Input('foreground-color') foregroundColor: string = "inherit";
  @Input('clickable') clickable: boolean = true;
  @Input('border') border: boolean = false;

}
