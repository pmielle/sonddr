import { Injectable, inject } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { BehaviorSubject } from 'rxjs';
import { KeycloakProfile } from 'keycloak-js';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // dependencies
  // --------------------------------------------
  keycloak = inject(KeycloakService);
  snack = inject(MatSnackBar);

  // attributes
  // --------------------------------------------
  profile$ = new BehaviorSubject<KeycloakProfile | undefined>(undefined);

  // lifecycle hooks
  // --------------------------------------------
  constructor() {
    if (this.keycloak.isLoggedIn()) { this.loadUserProfile(); }
  }

  // public methods
  // --------------------------------------------
  openAuthSnack(message: string|undefined = undefined) {
    message = message || "You must be logged in to do this";
    this.snack
      .open(message, "Log in", {duration: 5 * 1e3 })
      .onAction().subscribe(() => this.logIn());
  }

  isLoggedIn(): boolean {
    return this.keycloak.isLoggedIn();
  }

  logIn() {
    this.keycloak.login();
  }

  logOut() {
    this.keycloak.logout();
  }

  async loadUserProfile() {
    const profile = await this.keycloak.loadUserProfile();
    this.profile$.next(profile);
  }

  async getToken(): Promise<string> {
    return this.keycloak.getToken();
  }

}
