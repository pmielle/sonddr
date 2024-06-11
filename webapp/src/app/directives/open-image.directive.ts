import { Directive, HostListener, Input, inject } from '@angular/core';
import { HttpService } from '../services/http.service';

@Directive({
  selector: '[appOpenImage]',
})
export class OpenImageDirective {

  http = inject(HttpService);

  @Input('appOpenImage') imageId: string | undefined;

  constructor() { }

  @HostListener("click") onClick() {
    if (!this.imageId) { return; }
    const url = this.http.getImageUrl(this.imageId);
    window.open(url, "_blank");
  }

}
