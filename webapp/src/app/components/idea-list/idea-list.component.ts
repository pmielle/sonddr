import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { Idea } from 'sonddr-shared';
import { ColorService } from 'src/app/services/color.service';
import { MainNavService } from 'src/app/services/main-nav.service';
import { ScreenSizeService } from 'src/app/services/screen-size.service';
import { TimeService } from 'src/app/services/time.service';
import { TranslationService } from 'src/app/services/translation.service';

export type SortBy = "recent" | "popular";

export type ListSection = {
  header: string,
  ideas: Idea[],
  stuck: boolean,
};

@Component({
  selector: 'app-idea-list',
  templateUrl: './idea-list.component.html',
  styleUrls: ['./idea-list.component.scss']
})
export class IdeaListComponent implements OnChanges {

  // dependencies
  // --------------------------------------------
  screen = inject(ScreenSizeService);
  color = inject(ColorService);
  time = inject(TimeService);
  mainNav = inject(MainNavService);
  i18n = inject(TranslationService);
  elementRef = inject(ElementRef);

  // i/o
  // --------------------------------------------
  @Input("ideas") ideas?: Idea[];
  @Input("hide-sort-by") hideSortBy = false;
  @Input("stuck-background-color") stuckBackgroundColor: string = "#303030";
  @Output("sort-by-change") sortByChange = new EventEmitter<SortBy>();

  // attributes
  // --------------------------------------------
  sections?: ListSection[];
  sortBy: SortBy = "recent";

  // lifecycle hooks
  // --------------------------------------------
  ngOnChanges(changes: SimpleChanges): void {
    const change = changes["ideas"];
    if (!change) { return; }
    let ideas = change.currentValue;
    this.sections = ideas && ideas.length ? this.splitIdeasIntoSections(ideas) : undefined;
  }

  // methods
  // --------------------------------------------
  onHeaderClick(s: ListSection) {
    if (s.stuck) {
      this.mainNav.scrollToTop(true);
    }
  }

  splitIdeasIntoSections(ideas: Idea[]): ListSection[] {
    let sections: ListSection[] = [
      this._initSection(this.sortBy == "recent" ? this.i18n.get('sort-by.recent.today') : this.i18n.get('sort-by.popular.top-10')),
      this._initSection(this.sortBy == "recent" ? this.i18n.get('sort-by.recent.this-week') : this.i18n.get('sort-by.popular.top-50')),
      this._initSection("")
    ];
    if (this.sortBy == "recent") {
      const now = new Date();
      const aDayAgo = this.time.getNDaysBefore(now, 1);
      const aWeekAgo = this.time.getNDaysBefore(now, 7);
      ideas.forEach(i => {
        let sectionIndex = i.date > aDayAgo ? 0
          : i.date > aWeekAgo ? 1
          : 2;
        sections[sectionIndex].ideas.push(i);
      });
    } else {
      let cpt = 0;
      ideas.forEach(i => {
        cpt++;
        let sectionIndex = cpt <= 10 ? 0
          : cpt <= 25 ? 1
          : 2;
        sections[sectionIndex].ideas.push(i);
      });
    }
    return sections.filter(s => s.ideas.length > 0);
  }

  updateSortBy(sortBy: SortBy) {
    this.sortBy = sortBy;
    this.sortByChange.next(sortBy);
  }

  // private methods
  // --------------------------------------------
  _initSection(header: string): ListSection {
    return { header: header, ideas: [], stuck: false }
  }

}
