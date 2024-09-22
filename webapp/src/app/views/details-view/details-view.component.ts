import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { Goal } from 'sonddr-shared';
import { HttpService } from 'src/app/services/http.service';
import { ColorService } from 'src/app/services/color.service';
import { MainNavService } from 'src/app/services/main-nav.service';
import { TranslationService } from 'src/app/services/translation.service';


@Component({
  selector: 'app-details-view',
  templateUrl: './details-view.component.html',
  styleUrl: './details-view.component.scss'
})
export class DetailsViewComponent {

  // dependencies
  // --------------------------------------------
  route = inject(ActivatedRoute);
  http = inject(HttpService);
  color = inject(ColorService);
  mainNav = inject(MainNavService);
  i18n = inject(TranslationService);

  // attributes
  // --------------------------------------------
  routeSub?: Subscription;
  goal?: Goal;

  // lifecycle hooks
  // --------------------------------------------
  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe((map) => {
      const id = map.get("id")!;
      this.http.getGoal(id).then(g => this.goal = g);
    })

    // hide bottom bar and disable fab
    setTimeout(() => {
      this.mainNav.hideNavBar();
    }, 100); // otherwise NG0100

  }

  ngOnDestroy(): void {
    // unsubscribe
    this.routeSub?.unsubscribe();

    // restore nav bar and fab
    this.mainNav.showNavBar();
  }

  // methods
  // --------------------------------------------
  makeBackgroundColor(): string {
    return this.goal
      ? this.color.shadeColor(this.goal.color, -33)
      : '#303030'
  }

}
