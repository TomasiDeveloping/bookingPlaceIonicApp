import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Place} from '../../place.model';
import {PlacesService} from '../../places.service';
import {AlertController, LoadingController, NavController} from '@ionic/angular';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-edit-offer',
  templateUrl: './edit-offer.page.html',
  styleUrls: ['./edit-offer.page.scss'],
})
export class EditOfferPage implements OnInit, OnDestroy {

  place: Place;
  placeId: string;
  isLoading = false;
  form: FormGroup;
  private placeSub: Subscription;

  constructor(private route: ActivatedRoute,
              private placeService: PlacesService,
              private navCtr: NavController,
              private router: Router,
              private loadingCtr: LoadingController,
              private alertCtr: AlertController) { }

  ngOnInit() {
    this.route.paramMap.subscribe(paramMap => {
      if (!paramMap.has('placeId')) {
        this.navCtr.navigateBack('/places/tabs/offers').then();
        return;
      }
      this.placeId = paramMap.get('placeId');
      this.isLoading = true;
      this.placeSub = this.placeService.getPlace(paramMap.get('placeId'))
        .subscribe(place => {
        this.place = place;
        this.form = new FormGroup({
          title: new FormControl(this.place.title, {
            updateOn: 'blur', validators: [Validators.required]
          }),
          description: new FormControl(this.place.description, {
            updateOn: 'blur', validators: [Validators.required, Validators.maxLength(180)]
          })
        });
        this.isLoading = false;
      }, error => {
          this.alertCtr.create({
            header: 'An error occurred!',
            message: 'Place could not be fetched. Please try again later.',
            buttons: [{text: 'Okay', handler: () => {
              this.router.navigate(['places/tabs/offers']).then();
              }}]
          }).then(alertEl => {
            alertEl.present().then();
          });
        });
    });
  }

  onUpdateOffer() {
    if (!this.form.valid) {
      return;
    }
    this.loadingCtr.create({
      message: 'Updating place...'
    }).then(loadingEl => {
      loadingEl.present().then();
      this.placeService.updatePlace(this.place.id, this.form.value.title, this.form.value.description)
        .subscribe(() => {
          loadingEl.dismiss().then();
          this.form.reset();
          this.router.navigate(['/places/tabs/offers']).then();
        });
    });
  }

  ngOnDestroy(): void {
    if (this.placeSub) {
      this.placeSub.unsubscribe();
    }
  }
}
