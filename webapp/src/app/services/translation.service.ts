import { Injectable, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {

  transloco = inject(TranslocoService);

  constructor() { }

  get(selector: string, params?: object): string {
    return this.transloco.translate(selector, params);
  }

  getLocalizedAttr(obj: object, attr: string): string {
    const key = `${attr}-${this.transloco.getActiveLang()}`;
    if (obj.hasOwnProperty(key)) {
      // @ts-ignore
      return obj[key];
    } else {
      throw new Error(`key ${key} was not found in obj ${JSON.stringify(obj)}`);
    }
  }

}
