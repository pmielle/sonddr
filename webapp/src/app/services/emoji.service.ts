import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EmojiService {

  root_path = "/assets/emojis";
  map = new Map([
    [":)", "smile"],
    [":d", "open_mouthed"],
    [":o", "surprised"],
    [":p", "tongue_out"],
    [";)", "wink"],
    [":(", "sad"],
    [":s", "confused"],
    [":|", "disappointed"],
    [":'(", "crying"],
    [":$", "embarrassed"],
    ["(h)", "hot"],
    [":@", "angry"],
    ["(a)", "angel"],
    ["(6)", "devil"],
    [":-#", "dont_tell_anyone"],
    ["8o|", "baring_teeth"],
    ["8-|", "nerd"],
    ["^o)", "sarcastic"],
    [":-*", "secret_telling"],
    ["+o(", "sick"],
    [":^)", "i_dont_know"],
    ["*-)", "thinking"],
    ["<:o)", "party"],
    ["8-)", "eye_rolling"],
    ["|-)", "sleepy"],
    ["(c)", "coffee_cup"],
    ["(y)", "thumbs_up"],
    ["(n)", "thumbs_down"],
    ["(b)", "beer_mug"],
    ["(d)", "martini_glass"],
    ["(x)", "girl"],
    ["(z)", "boy"],
    ["({)", "left_hug"],
    ["(})", "right_hug"],
    [":[", "vampire_bat"],
    ["(^)", "birthday_cake"],
    ["(l)", "red_heart"],
    ["(u)", "broken_heart"],
    ["(k)", "red_lips"],
    ["(g)", "gift_with_a_bow"],
    ["(f)", "red_rose"],
    ["(w)", "wilted_rose"],
    ["(p)", "camera"],
    ["(~)", "filmstrip"],
    ["(@)", "cat_face"],
    ["(&)", "dog_face"],
    ["(t)", "telephone_reciever"],
    ["(i)", "light_bulb"],
    ["(8)", "note"],
    ["(s)", "sleeping_half_moon"],
    ["(*)", "star"],
    ["(e)", "e_mail"],
    ["(o)", "clock"],
    ["(m)", "msn_messenger_icon"],
    ["(sn)", "snail"],
    ["(bah)", "black_sheep"],
    ["(pl)", "plate"],
    ["(ll)", "bowl"],
    ["(pi)", "pizza"],
    ["(so)", "soccer_ball"],
    ["(au)", "auto"],
    ["(ap)", "airplane"],
    ["(um)", "umbrella"],
    ["(ip)", "island_with_a_palm_tree"],
    ["(co)", "computer"],
    ["(mp)", "mobile_phone"],
    ["(st)", "stormy_cloud"],
    ["(li)", "lightning"],
    ["(mo)", "money"],
  ]);

  constructor() { }

  get(emoji: string): string {
    return `${this.root_path}/${this.map.get(emoji)}.gif`;
  }

  listAll(): string[] {
    return Array.from(this.map.keys());
  }

}
