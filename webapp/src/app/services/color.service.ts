import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ColorService {

  // lifecycle hooks
  // --------------------------------------------
  constructor() { }

  // methods
  // --------------------------------------------
  // https://stackoverflow.com/a/73985027
  transparentColor(color: string, opacity: number): string {
    //if it has an alpha, remove it
    if (color.length > 7)
        color = color.substring(0, color.length - 2);

    // coerce values so ti is between 0 and 1.
    const _opacity = Math.round(Math.min(Math.max(opacity, 0), 1) * 255);
    let opacityHex = _opacity.toString(16).toUpperCase()

    // opacities near 0 need a trailing 0
    if (opacityHex.length == 1)
        opacityHex = "0" + opacityHex;

    return color + opacityHex;

  }
  
  // https://stackoverflow.com/a/13532993
  shadeColor(color: string, percent: number): string {

    var R = parseInt(color.substring(1,3),16);
    var G = parseInt(color.substring(3,5),16);
    var B = parseInt(color.substring(5,7),16);

    R = R * (100 + percent) / 100;
    G = G * (100 + percent) / 100;
    B = B * (100 + percent) / 100;

    R = (R<255)?R:255;  
    G = (G<255)?G:255;  
    B = (B<255)?B:255;  

    R = Math.round(R)
    G = Math.round(G)
    B = Math.round(B)

    var RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
    var GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
    var BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));

    return "#"+RR+GG+BB;
}
  
}
