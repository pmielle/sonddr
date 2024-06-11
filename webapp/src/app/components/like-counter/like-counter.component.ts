import { Component, Input } from '@angular/core';
import { Idea } from 'sonddr-shared';

@Component({
  selector: 'app-like-counter',
  templateUrl: './like-counter.component.html',
  styleUrl: './like-counter.component.scss'
})
export class LikeCounterComponent {

  @Input("idea") idea?: Idea;

}
