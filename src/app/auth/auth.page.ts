import { Component, OnInit } from '@angular/core';
import {AuthResponseData, AuthService} from './auth.service';
import {Router} from '@angular/router';
import {AlertController, LoadingController} from '@ionic/angular';
import {NgForm} from '@angular/forms';
import {Observable} from "rxjs";

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage implements OnInit {

  isLoading = false;
  isLogin = true;

  constructor(private authService: AuthService,
              private router: Router,
              private loadingCtr: LoadingController,
              private alertCtr: AlertController) { }

  ngOnInit() {
  }

  authenticate(email: string, password: string) {
    this.isLoading = true;
    this.loadingCtr.create({keyboardClose: true, message: 'Logging in...'})
      .then(loadingEl => {
        loadingEl.present().then();
        let authObs: Observable<AuthResponseData>;
        if (this.isLogin) {
          authObs = this.authService.login(email, password);
        } else {
          authObs = this.authService.signUp(email, password);
        }
        authObs.subscribe(resData => {
          this.isLoading = false;
          loadingEl.dismiss().then();
          this.router.navigateByUrl('/places/tabs/discover').then();
        }, error => {
          loadingEl.dismiss().then();
          const code = error.error.error.message;
          let message = 'Could not sign you up, please try again.';
          if (code === 'EMAIL_EXISTS') {
            message = 'This email address exists already!';
          } else if (code === 'EMAIL_NOT_FOUND') {
            message = 'E-Mail address could not be found.';
          } else if (code === 'INVALID_PASSWORD') {
            message = 'This password is not correct.';
          }
          this.showAlert(message);
        });
      });
  }

  onSubmit(form: NgForm) {
    if (!form.valid) {
      return;
    }
    const email = form.value.email;
    const password = form.value.password;

    this.authenticate(email, password);
    form.reset();
  }

  onSwitchAuthMode() {
    this.isLogin = !this.isLogin;
  }

  private showAlert(message: string) {
    this.alertCtr.create({
      header: 'Authentication failed!',
      message,
      buttons: ['Okay']
    }).then(alertEl => {alertEl.present().then();});
  }
}
