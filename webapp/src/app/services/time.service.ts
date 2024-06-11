import { Injectable } from '@angular/core';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_IN_MS = 86400000;

@Injectable({
  providedIn: 'root'
})
export class TimeService {

  // attributes
  // --------------------------------------------
  // ...

  // lifecycle hooks
  // --------------------------------------------
  constructor() { }

  // public methods
  // --------------------------------------------
  getYear(date?: Date): string {
    if (!date) { return ""; }
    const year = date.getFullYear();
    return year.toString();
  }

  getNDaysBefore(date: Date, n: number): Date {
    let newDate = new Date(date);  // clone
    newDate.setDate(date.getDate() - n);
    return newDate;
  }

  // https://muffinman.io/blog/javascript-time-ago-function/
  makeAgo(date?: Date): string {
    if (!date) { return ""; }
    const today = new Date();
    const yesterday = new Date(today.getTime() - DAY_IN_MS);
    const seconds = Math.round((today.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const isToday = today.toDateString() === date.toDateString();
    const isYesterday = yesterday.toDateString() === date.toDateString();
    const isThisYear = today.getFullYear() === date.getFullYear();
    if (seconds < 5) {
      return 'now';
    } else if (seconds < 60) {
      return `${seconds} seconds ago`;
    } else if (seconds < 90) {
      return 'about a minute ago';
    } else if (minutes < 60) {
      return `${minutes} minutes ago`;
    } else if (isToday) {
      return this._getFormattedDate(date, 'Today'); // Today at 10:20
    } else if (isYesterday) {
      return this._getFormattedDate(date, 'Yesterday'); // Yesterday at 10:20
    } else if (isThisYear) {
      return this._getFormattedDate(date, undefined, true); // 10. January at 10:20
    }
    return this._getFormattedDate(date); // 10. January 2017. at 10:20
  }

  // private methods
  // --------------------------------------------
  _getFormattedDate(date: Date, prefomattedDate: string|undefined = undefined, hideYear = false) {
    const day = date.getDate();
    const month = MONTH_NAMES[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours();
    let minutes: number | string = date.getMinutes();
    if (minutes < 10) {
      // Adding leading zero to minutes
      minutes = `0${minutes}`;
    }
    if (prefomattedDate) {
      // Today at 10:20
      // Yesterday at 10:20
      return `${prefomattedDate} at ${hours}:${minutes}`;
    }
    if (hideYear) {
      // 10. January at 10:20
      return `${day}. ${month} at ${hours}:${minutes}`;
    }
    // 10. January 2017. at 10:20
    return `${day}. ${month} ${year}. at ${hours}:${minutes}`;
  }

}
