import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private _userIsAuthenticated = false;

  get userIsAuthenticated() {
    // eslint-disable-next-line no-underscore-dangle
    return this._userIsAuthenticated;
  }

  constructor() { }

  login() {
    // eslint-disable-next-line no-underscore-dangle
    this._userIsAuthenticated = true;
  }

  logout() {
    // eslint-disable-next-line no-underscore-dangle
    this._userIsAuthenticated = false;
  }
}
