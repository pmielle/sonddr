import { Component, Input, inject } from '@angular/core';
import { Goal } from 'sonddr-shared';

@Component({
  selector: 'app-goal-chip',
  templateUrl: './goal-chip.component.html',
  styleUrls: ['./goal-chip.component.scss']
})
export class GoalChipComponent {

  // dependencies
  // --------------------------------------------
  // ...

  // attributes
  // --------------------------------------------
  @Input('goal') goal?: Goal;
  @Input('no-label') noLabel: boolean = false;
  @Input('clickable') clickable: boolean = true;

  // methods
  // --------------------------------------------
  // ...
  
}