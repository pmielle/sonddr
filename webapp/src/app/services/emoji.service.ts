import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EmojiService {

  root_path = "/assets/emojis";
  map = new Map([
    [":)", "smile"],
    [":o", "surprised"],
    [";)", "wink"],
    [":s", "confused"],
    [":'(", "crying"],
    ["(h)", "hot"],
    ["(a)", "angel"],
    [":-#", "dont_tell_anyone"],
    ["8-|", "nerd"],
    [":-*", "secret_telling"],
    [":^)", "i_dont_know"],
    ["<:o)", "party"],
    ["|-)", "sleepy"],
    ["(y)", "thumbs_up"],
    ["(b)", "beer_mug"],
    ["(x)", "girl"],
    ["({)", "left_hug"],
    [":[", "vampire_bat"],
    ["(l)", "red_heart"],
    ["(k)", "red_lips"],
    ["(f)", "red_rose"],
    ["(p)", "camera"],
    ["(@)", "cat_face"],
    ["(t)", "telephone_reciever"],
    ["(8)", "note"],
    ["(*)", "star"],
    ["(o)", "clock"],
    ["(sn)", "snail"],
    ["(pl)", "plate"],
    ["(pi)", "pizza"],
    ["(au)", "auto"],
    ["(um)", "umbrella"],
    ["(co)", "computer"],
    ["(st)", "stormy_cloud"],
    ["(mo)", "money"],
    [":d", "open_mouthed"],
    [":p", "tongue_out"],
    [":(", "sad"],
    [":|", "disappointed"],
    [":$", "embarrassed"],
    [":@", "angry"],
    ["(6)", "devil"],
    ["8o|", "baring_teeth"],
    ["^o)", "sarcastic"],
    ["+o(", "sick"],
    ["*-)", "thinking"],
    ["8-)", "eye_rolling"],
    ["(c)", "coffee_cup"],
    ["(n)", "thumbs_down"],
    ["(d)", "martini_glass"],
    ["(z)", "boy"],
    ["(})", "right_hug"],
    ["(^)", "birthday_cake"],
    ["(u)", "broken_heart"],
    ["(g)", "gift_with_a_bow"],
    ["(w)", "wilted_rose"],
    ["(~)", "filmstrip"],
    ["(&)", "dog_face"],
    ["(i)", "light_bulb"],
    ["(s)", "sleeping_half_moon"],
    ["(e)", "e_mail"],
    ["(m)", "msn_messenger_icon"],
    ["(bah)", "black_sheep"],
    ["(ll)", "bowl"],
    ["(so)", "soccer_ball"],
    ["(ap)", "airplane"],
    ["(ip)", "island_with_a_palm_tree"],
    ["(mp)", "mobile_phone"],
    ["(li)", "lightning"],
  ]);

  constructor() { }

  get(emoji: string): string {
    return `${this.root_path}/${this.map.get(emoji)}.gif`;
  }

}
