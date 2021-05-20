import {Injectable, OnDestroy} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, from} from 'rxjs';
import {User} from './user.model';
import {map, tap} from 'rxjs/operators';
import {Plugins} from '@capacitor/core';

export interface AuthResponseData {
  kind: string;
  idToken: string;
  email: string;
  refreshToken: string;
  localId: string;
  expiresIn: string;
  registered?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy{

  private _user = new BehaviorSubject<User>(null);
  private activeLogoutTimer: any;

  get userIsAuthenticated() {
    // eslint-disable-next-line no-underscore-dangle
    return this._user.asObservable().pipe(map(user => {
      if (user) {
        return !!user.token;
      }
      return false;
    }));
  }

  get userId() {
    // eslint-disable-next-line no-underscore-dangle
    return this._user.asObservable().pipe(map(user => {
      if (user) {
        return user.id;
      }
      return null;
    }));
  }

  get token() {
    // eslint-disable-next-line no-underscore-dangle
    return this._user.asObservable().pipe(map(user => {
      if (user) {
        return user.token;
      }
      return null;
    }));
  }

  constructor(private http: HttpClient) { }

  autoLogin() {
    return from(Plugins.Storage.get({key: 'authData'})).pipe(map(storedData => {
      if (!storedData || !storedData.value) {
        return null;
      }
      const parsedData = JSON.parse(storedData.value) as {token: string; tokenExpirationDate: string; userId: string; email: string};
      const expirationTime = new Date(parsedData.tokenExpirationDate);
      if (expirationTime <= new Date()) {
        return null;
      }
      const user = new User(parsedData.userId, parsedData.email, parsedData.token, expirationTime);
      return user;
    }), tap(user => {
      if (user) {
        // eslint-disable-next-line no-underscore-dangle
        this._user.next(user);
       // this.autoLogout(user.tokenDuration);
      }
      }),
      map(user => !!user)
    );
  }

  // autoLogout(duration: number) {
  //   if (this.activeLogoutTimer) {
  //     clearTimeout(this.activeLogoutTimer);
  //   }
  //   this.activeLogoutTimer = setTimeout(() => {
  //     this.logout();
  //   }, duration);
  // }

  signUp(email: string, password: string) {
    return this.http.post<AuthResponseData>('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=\n' +
      'AIzaSyDkyee2QmoGPGGs8NPwLwJLJF5VGITkHS8', {email, password, returnSecureToken: true})
      .pipe(tap(this.setUserData.bind(this)));
  }

  login(email: string, password: string) {
    return this.http.post<AuthResponseData>('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' +
      'AIzaSyDkyee2QmoGPGGs8NPwLwJLJF5VGITkHS8', {
      email, password, returnSecureToken: true})
      .pipe(tap(this.setUserData.bind(this)));
  }

  logout() {
    if (this.activeLogoutTimer) {
      clearTimeout(this.activeLogoutTimer);
    }
    // eslint-disable-next-line no-underscore-dangle
    this._user.next(null);
    Plugins.Storage.remove({key: 'authData'}).then();
  }

  private setUserData(userData: AuthResponseData) {
      const expirationTime = new Date(new Date().getTime() + (+userData.expiresIn * 1000));
      const user = new User(userData.localId, userData.email, userData.idToken, expirationTime);
      // eslint-disable-next-line no-underscore-dangle
      this._user.next(user);
      //this.autoLogout(user.tokenDuration);
      this.storeAuthData(userData.localId, userData.idToken, expirationTime.toISOString(), userData.email);
  }

  private storeAuthData(userId: string, token: string, tokenExpirationDate: string, email: string) {
    const data = JSON.stringify({userId, token, tokenExpirationDate, email});
    Plugins.Storage.set({key: 'authData', value: data}).then();
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  ngOnDestroy(): void {
    if (this.activeLogoutTimer) {
      clearTimeout(this.activeLogoutTimer);
    }
  }
}
