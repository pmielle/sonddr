import { Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild, inject } from '@angular/core';
import { ScreenSizeService } from 'src/app/services/screen-size.service';

const invisible_space = '\u200B';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss'
})
export class EditorComponent {

  // dependencies
  // --------------------------------------------
  screen = inject(ScreenSizeService);

  // I/O
  // --------------------------------------------
  @Input("text-only") textOnly = false;
  @Input("placeholder") placeholder?: string;
  @Output("focus") focus = new EventEmitter<void>();
  @Output("blur") blur = new EventEmitter<void>();
  @ViewChild("contentDiv") contentDiv?: ElementRef;
  @ViewChild("link") link?: ElementRef;
  @HostListener('document:selectionchange') onSelectionChange() {
    if (!this.contentDivHasFocus()) { return undefined; } // actual selection change in content div
    this.refreshSelection();
    this.refreshInTags();
  }
  selection?: Selection;
  rangeBkp?: Range;
  showLinkPopup = false;
  br = '<br>';
  images: Map<string, File> = new Map();  // key is the #id of the image
  content = "";
  inTags = new Set<string>();
  weirdTags = new Set<string>(["div", "span", "#text"]); // lowercase
  inFocus = false;

  // lifecycle hooks
  // --------------------------------------------
  // ...

  // methods
  // --------------------------------------------
  onInputFocus() {
    this.focus.next();
    this.inFocus = true;
  }

  onInputBlur() {
    this.blur.next();
    this.inFocus = false;
  }

  onKeyUp(event: KeyboardEvent): void {
    this.refreshContent();
    if (event.key === "Escape") {
      this.contentDiv?.nativeElement.blur();
    } else if (this.isEmpty(this.contentDiv?.nativeElement)) {
      this.contentDiv!.nativeElement.innerHTML = "";
    } else if (event.key === "ArrowRight") {
      if (this.selection?.type === "Caret") {
        if (this.isAtEndOfLastText() && this.inOutableTag()) {
          this.goToAfterLastText();
        }
      }
    } else if (event.key === "Enter") {
      if (this.selection?.type === "Caret") {
        if (this.inTags.has("li")) {
          const currentItem = this.selection.anchorNode?.parentElement;
          const previousItem = currentItem?.previousSibling;
          if (! previousItem) { return; }
          if (this.isEmpty(previousItem)) {
            this.goToAfterLastText();
            const list = currentItem?.parentElement;
            const secondTolastItem = list?.children[list.children.length - 2];
            const lastItem = list?.children[list.children.length - 1];
            secondTolastItem?.remove();
            lastItem?.remove();
          }
        }
      }
    }
  }

  onLinkButtonClick() {
    if (this.selection?.rangeCount != 1) { return; }
    this.bkpSelection();
    this.showLinkPopup = true;
    setTimeout( () => this.link?.nativeElement.focus(), 0);  // let it display first
  }

  addLink(url: string): void {
    this.showLinkPopup = false;
    this.restoreSelection();
    const link = this.format("a", { href: url });
    if (this.selection?.type === "Caret") { link.textContent = url; }
    this.moveTo(link, "end");
  }

  bkpSelection() {
    this.rangeBkp = this.selection?.getRangeAt(0);
  }

  restoreSelection() {
    this.selection?.removeAllRanges();
    this.selection?.addRange(this.rangeBkp!);
    this.rangeBkp = undefined;
  }

  setContent(content: string) {
    this.contentDiv!.nativeElement.innerHTML = content;
    this.refreshContent();
  }

  refreshContent() {
    this.content = this.isEmpty(this.contentDiv?.nativeElement)
      ? ""
      : this.contentDiv?.nativeElement.innerHTML;
  }

  onFormatButtonClick(tag: string): void {
    this.inTags.has(tag) ? this.endFormat(tag) : this.format(tag);
  }

  chooseButtonColor(tag: string): string|null {
    return this.inTags.has(tag) ? "primary" : null;
  }

  addImage(file: File): void {
    if (this.selection!.type !== "Caret") { return; }
    const range = this.selection!.getRangeAt(0);
    // create the image and a new div
    const id = Date.now().toString();
    const previewUrl = URL.createObjectURL(file);
    const newImg = this.createElement("img", {
      src: previewUrl, // order matters: the backend expects src first
      id: id,
    });
    const newDiv = this.createElement("div");
    // insert the new nodes
    range.insertNode(newDiv);
    range.insertNode(newImg);
    this.moveTo(newDiv);
    // keep track of inserted images
    this.images.set(id, file);
  }

  formatList(listTag: string): void {
    const list = this.format(listTag);
    const child_nodes = list.innerHTML.split(this.br).map(content => {
      const newNode = document.createElement("li");
      newNode.innerHTML = content;
      return newNode;
    });
    list.replaceChildren(...child_nodes);
  }

  // private methods
  // --------------------------------------------
  goToAfterLastText(): void {
    const lastText = this.getLastTextOfNode(this.contentDiv?.nativeElement);
    const newText = document.createTextNode(invisible_space);
    let lastElem = lastText?.parentElement;
    if (this.inTags.has("ul") || this.inTags.has("ol")) {
      lastElem = lastElem?.parentElement;
    }
    lastElem?.after(newText);
    this.moveTo(newText);
  }

  inOutableTag(): boolean {
    const onlyInWeirdTags = this.inTags.size <= this.weirdTags.size && [...this.inTags].every(t => this.weirdTags.has(t));
    return !onlyInWeirdTags;
  }

  isAtEndOfLastText(): boolean {
    let node = this.selection?.focusNode;
    const inLastNode = this.getLastTextOfNode(this.contentDiv?.nativeElement) === node;
    const atEndOfNode = this.selection?.anchorOffset === node?.textContent?.length;
    return inLastNode && atEndOfNode;
  }

  // n.b. cannot simply get lastchild, <br> gets added
  // and empty invisible (??) text node too sometimes
  getLastTextOfNode(node: HTMLElement): Text|undefined {
    for (let i = node.childNodes.length - 1; i >= 0; i--) { // browse children from the end
      const child = node.childNodes[i];
      if (child.nodeType === Node.TEXT_NODE && child.textContent) { // isEmpty because empty invisible text sometimes
        return child as Text;
      }
      if (child.hasChildNodes()) {
        const lastTextOfChild = this.getLastTextOfNode(child as HTMLElement);
        if (lastTextOfChild) { return lastTextOfChild; }
      }
    }
    return undefined; // no text node has been found at all
  }

  isEmpty(node: Node): boolean {
    return ! node.textContent?.match(/\w/);
  }

  endFormat(tag: string): void {
    if (this.selection!.type === "Caret") {
      const range = this.selection!.getRangeAt(0);
      this.endFormatInRange(tag, range);
    } else if (this.selection!.type === "Range") {
      for (let i = 0; i < this.selection!.rangeCount; i++) {
        const range = this.selection!.getRangeAt(i);
        if (range.startContainer === range.endContainer) {
          this.endFormatInRange(tag, range);
        }
      }
    }
  }

  endFormatInRange(tag: string, range: Range) {
    const node = range.startContainer.parentElement!.closest(tag)!;
    const afterNode = document.createElement(tag);
    const beforeNode = document.createElement(tag);
    afterNode.innerText = node.textContent!.substring(range.endOffset);
    beforeNode.innerText = node.textContent!.substring(0, range.startOffset);
    const innerNode = document.createTextNode(node.textContent!.substring(range.startOffset, range.endOffset));
    node.replaceWith(beforeNode, innerNode, afterNode);
    if (this.isEmpty(beforeNode)) { beforeNode.remove(); }
    if (this.isEmpty(afterNode)) { afterNode.remove(); }
    this.moveTo(innerNode, "end");
  }

  createElement(tag: string, attributes: object|undefined=undefined): HTMLElement {
    const newNode = document.createElement(tag);
    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        newNode.setAttribute(key, value);
      });
    }
    return newNode;
  }

  format(tag: string, attributes: object | undefined = undefined): HTMLElement {
    // prepare the node to insert
    const newNode = this.createElement(tag, attributes);
    // depending on the current selection (see this.getSelection)
    // - add a new empty tag at the cursor position
    // - or surround the selected text with a new tag
    if (this.selection!.type === "Caret") {
      const range = this.selection!.getRangeAt(0);
      range.insertNode(newNode);
      this.moveTo(newNode);
    } else if (this.selection!.type === "Range") {
      for (let i = 0; i < this.selection!.rangeCount; i++) {
        const range = this.selection!.getRangeAt(i);
        range.surroundContents(newNode);
      }
    }
    return newNode;
  }

  moveTo(node: Node, where: "start"|"end" = "start"): void {
    if (! node.textContent) { node.textContent = invisible_space; } // cannot move inside an empty node
    const endOffset = node.nodeType === Node.TEXT_NODE ? node.textContent.length :node.childNodes.length;
    const offset = where === "start" ? 1 : endOffset;
    document.getSelection()?.setPosition(node, offset);
  }

  refreshInTags(): void {
    this.inTags.clear();
    if (this.selection?.type === "Caret") {
      let node = this.selection?.focusNode;
      while (node && node !== this.contentDiv?.nativeElement) {
        if (node) { this.inTags.add(node.nodeName.toLowerCase()); }
        node = node?.parentNode || null;
      }
    } else if (this.selection?.type === "Range") {
      for (let i = 0; i < this.selection.rangeCount; i++) {
        const range = this.selection.getRangeAt(i);
        if (range.startContainer === range.endContainer) {
          let node: Node|null = range.startContainer;
          while (node && node !== this.contentDiv?.nativeElement) {
            if (node) { this.inTags.add(node.nodeName.toLowerCase()); }
            node = node?.parentNode || null;
          }
        }
      }
    }
  }

  contentDivHasFocus(): boolean {
    return document.activeElement?.closest(`#${this.contentDiv?.nativeElement.id}`)
      ? true : false;
  }

  refreshSelection() {
    this.selection = document.getSelection() || undefined;
  }

}
