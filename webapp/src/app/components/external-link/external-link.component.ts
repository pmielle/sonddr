import { Component, Input } from '@angular/core';
import { ExternalLink } from 'sonddr-shared';

@Component({
  selector: 'app-external-link',
  templateUrl: './external-link.component.html',
  styleUrls: ['./external-link.component.scss']
})
export class ExternalLinkComponent {

  // I/O
  // --------------------------------------------
  @Input('external-link') externalLink?: ExternalLink;

  // methods
  // --------------------------------------------
  openExternalLink() {
    window.open(this.externalLink?.url, "_blank");
  }

}
