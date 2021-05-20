import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {
  ActionSheetController,
  AlertController,
  LoadingController,
  ModalController,
  NavController
} from '@ionic/angular';
import {PlacesService} from '../../places.service';
import {Place} from '../../place.model';
import {CreateBookingComponent} from '../../../bookings/create-booking/create-booking.component';
import {Subscription} from 'rxjs';
import {BookingService} from '../../../bookings/booking.service';
import {AuthService} from '../../../auth/auth.service';
import {MapModelComponent} from '../../../shared/map-model/map-model.component';
import {switchMap, take, tap} from 'rxjs/operators';

@Component({
  selector: 'app-place-detail',
  templateUrl: './place-detail.page.html',
  styleUrls: ['./place-detail.page.scss'],
})
export class PlaceDetailPage implements OnInit, OnDestroy {

  place: Place;
  isBookable = false;
  isLoading = false;
  private placeSub: Subscription;

  constructor(private route: ActivatedRoute,
              private navCtr: NavController,
              private placesService: PlacesService,
              private modalCtr: ModalController,
              private actionSheetCtr: ActionSheetController,
              private bookingService: BookingService,
              private loadingCtr: LoadingController,
              private authService: AuthService,
              private alertCtr: AlertController,
              private router: Router) { }

  ngOnInit() {
    this.route.paramMap.subscribe(paramMap => {
      if (!paramMap.has('placeId')) {
        this.navCtr.navigateBack('/places/tabs/discover').then();
        return;
      }
      this.isLoading = true;
      let fetchedUserId: string;
      this.authService.userId
        .pipe(
          take(1),
          switchMap(userId => {
        if (!userId) {
          throw new Error('Found no user!');
        }
        fetchedUserId = userId;
        return this.placesService.getPlace(paramMap.get('placeId'));
      })
      ).subscribe(place => {
        this.place = place;
        this.isBookable = place.userId !== fetchedUserId;
        this.isLoading = false;
      }, error => {
        this.alertCtr.create({
          header: 'An error occurred!',
          message: 'Could not load place.',
          buttons: [{
            text: 'Okay', handler: () => {
              this.router.navigate(['/places/tabs/discover']).then();
          }
          }]
        })
          .then(alertEl => {
            alertEl.present().then();
          });
      });
    });
  }

  onBookPlace() {
    // this.router.navigateByUrl('/places/tabs/discover').then();
    // this.navCtr.navigateBack('/places/tabs/discover').then();
    // this.navCtr.pop().then();
    this.actionSheetCtr.create({
      header: 'Choose an Action',
      buttons: [
        {
          text: 'Select Date',
          handler: () => {
            this.openBookingModal('select');
          }
        },
        {
          text: 'Random Date',
          handler: () => {
            this.openBookingModal('random');
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    }).then(actionSheetEl => {
      actionSheetEl.present().then();
    });
  }

  openBookingModal(mode: 'select' | 'random') {
    console.log(mode);
    this.modalCtr.create({
      component: CreateBookingComponent,
      componentProps: {selectedPlace: this.place, selectedMode: mode}
    })
      .then(modalEl => {
        modalEl.present().then();
        return modalEl.onDidDismiss();
      }).then(resultData => {
      if (resultData.role === 'confirm') {
        this.loadingCtr
          .create({message: 'Booking place...'})
          .then(loadingEl => {
            loadingEl.present().then();
            const data = resultData.data.bookingData;
            this.bookingService.addBooking(
              this.place.id,
              this.place.title,
              this.place.imageUrl,
              data.firstName,
              data.lastname,
              data.guestNumber,
              data.startDate,
              data.endDate
            ).subscribe(() => {
              loadingEl.dismiss().then();
            });
          });
      }
    });
  }

  ngOnDestroy(): void {
    if (this.placeSub) {
      this.placeSub.unsubscribe();
    }
  }

  onShowFullMap() {
    this.modalCtr.create({component: MapModelComponent, componentProps: {
      center: {lat: this.place.location.lat, lng:  this.place.location.lng},
        selectable: false,
        closeButtonText: 'Close',
        title: this.place.location.address
      }})
      .then(modalEl => {
        modalEl.present().then();
      });
  }
}
