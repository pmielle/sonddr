import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NumberService {

  // attributes
  // --------------------------------------------
  compactFormatter = Intl.NumberFormat('en', {notation: 'compact'});

  constructor() { }

  // methods
  // --------------------------------------------
  compact(n: number): string {
    return this.compactFormatter.format(n);
  }
}
