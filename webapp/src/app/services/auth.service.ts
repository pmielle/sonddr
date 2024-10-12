import { Injectable, inject } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { BehaviorSubject } from 'rxjs';
import { KeycloakProfile } from 'keycloak-js';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // dependencies
  // --------------------------------------------
  keycloak = inject(KeycloakService);

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
