import { Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { Idea } from 'sonddr-shared';
import { HttpService } from 'src/app/services/http.service';
import { MainNavService } from 'src/app/services/main-nav.service';
import { UserDataService } from 'src/app/services/user-data.service';

@Component({
  selector: 'app-search-view',
  templateUrl: './search-view.component.html',
  styleUrls: ['./search-view.component.scss']
})
export class SearchViewComponent implements OnDestroy {

  // dependencies
  // --------------------------------------------
  userData = inject(UserDataService);
  http = inject(HttpService);
  mainNav = inject(MainNavService);

  // attributes
  // --------------------------------------------
  searchString: string = "";
  ideas?: Idea[];
  @ViewChild('input') input?: ElementRef;

  // lifecycle hooks
  // --------------------------------------------
  ngOnDestroy(): void {
      this.mainNav.showNavBar();
  }

  // methods
  // --------------------------------------------
  onInputFocus() {
    this.mainNav.scrollToTop();
  }

  makeSearchResultsLabel(): string {
    if (!this.ideas) { return ""; }
    const nb = this.ideas.length;
    const plural = nb > 1;
    return `${nb} search result${plural ? 's': ''}`;
  }

  search() {
    this.input?.nativeElement.blur();
    if (!this.searchString) {
      this.clearSearch();
      return;
    }
    this.http.searchIdeas(this.searchString).then(i => this.ideas = i);
  }

  clearSearch() {
    this.searchString = "";
    this.ideas = undefined;
    this.input?.nativeElement.focus();
  }

}
