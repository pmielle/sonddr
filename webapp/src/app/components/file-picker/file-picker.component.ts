import { Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';

@Component({
  selector: 'app-file-picker',
  templateUrl: './file-picker.component.html',
  styleUrls: ['./file-picker.component.scss']
})
export class FilePickerComponent {

  @ViewChild("input") inputChild?: ElementRef;
  @Output("file-change") fileChange = new EventEmitter<File>();

  onClick() {
    (this.inputChild?.nativeElement as HTMLElement).click();
  }

  onChange(e: any) {
    const file = e.target.files[0];
    if (file) {
      this.fileChange.next(file);
    }
  }

}
