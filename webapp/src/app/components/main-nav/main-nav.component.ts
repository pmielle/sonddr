import { Component, inject, ViewChild, ElementRef } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { MainNavService } from 'src/app/services/main-nav.service';
import { ScreenSizeService } from 'src/app/services/screen-size.service';

@Component({
  selector: 'app-main-nav',
  templateUrl: './main-nav.component.html',
  styleUrls: ['./main-nav.component.scss']
})
export class MainNavComponent {

  screen = inject(ScreenSizeService);
  auth = inject(AuthService);
  mainNav = inject(MainNavService);
  @ViewChild('tabs') tabs?: ElementRef;

  ngAfterViewInit(): void {
    this.tabs!.nativeElement.onscroll = (e: Event) => {
      this.mainNav.onScroll(e.target as Element);
    };

  }

}
