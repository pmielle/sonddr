import { Component, Input, inject } from '@angular/core';
import { ScreenSizeService } from 'src/app/services/screen-size.service';

@Component({
  selector: 'app-nav-bar-item',
  templateUrl: './nav-bar-item.component.html',
  styleUrls: ['./nav-bar-item.component.scss']
})
export class NavBarItemComponent {
  
  // dependencies
  // --------------------------------------------
  screen = inject(ScreenSizeService);


  // I/O
  // --------------------------------------------
  @Input("label") label!: string;
  @Input("icon") icon!: string;
  @Input("outlined") outlined = false;
  @Input("badge") badge: string|number|null|undefined;
}
