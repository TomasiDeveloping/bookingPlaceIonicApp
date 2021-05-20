import {Component, OnInit, EventEmitter, Output, Input} from '@angular/core';
import {ActionSheetController, AlertController, ModalController} from '@ionic/angular';
import {MapModelComponent} from '../../map-model/map-model.component';
import {HttpClient} from '@angular/common/http';
import {map, switchMap} from 'rxjs/operators';
import {Coordinates, PlaceLocation} from '../../../places/location.model';
import {of} from 'rxjs';
import {Plugins, Capacitor} from '@capacitor/core';


@Component({
  selector: 'app-location-picker',
  templateUrl: './location-picker.component.html',
  styleUrls: ['./location-picker.component.scss'],
})
export class LocationPickerComponent implements OnInit {
  @Output() locationPick = new EventEmitter<PlaceLocation>();
  @Input() showPreview = false;
  selectedLocationImage: string;
  isLoading = false;

  constructor(private modalCtr: ModalController,
              private http: HttpClient,
              private actionSheetCtr: ActionSheetController,
              private alertCtrl: AlertController) { }

  ngOnInit() {}

  onPickLocation() {
    this.actionSheetCtr.create({
      header: 'Please Choose',
      buttons: [
        {text: 'Auto-Locate', handler: () => {this.locateUser();}},
        {text: 'Pick on Map', handler: () => { this.openMap();}},
        {text: 'Cancel', role: 'cancel'}
      ]
    }).then(actionSheetEl => {
      actionSheetEl.present().then();
    });
  }

  private locateUser() {
    if (!Capacitor.isPluginAvailable('Geolocation')) {
      this.showErrorAlert();
      return;
    }
    this.isLoading = true;
    Plugins.Geolocation.getCurrentPosition()
      .then(gePosition => {
        const coordinates: Coordinates = {lat: gePosition.coords.latitude, lng: gePosition.coords.longitude};
        this.createPlace(coordinates.lat, coordinates.lng);
        this.isLoading = false;
      })
      .catch(() => {
        this.isLoading = false;
      this.showErrorAlert();
    });
  }

  private showErrorAlert() {
    this.alertCtrl.create({
      header: 'Could not fetch location',
      message: 'Please use the map to pick a location!',
      buttons: ['Okay']
    })
      .then(alertEl => alertEl.present().then());
  }

  private openMap() {
    this.modalCtr.create({component: MapModelComponent})
      .then(modalEl => {
        modalEl.onDidDismiss().then(modalData => {
          if (!modalData.data) {
            return;
          }
          const coordinates: Coordinates = {lat: modalData.data.lat, lng: modalData.data.lng};
          this.createPlace(coordinates.lat, coordinates.lng);
        });
        modalEl.present().then();
      });
  }

  private createPlace(lat: number, lng: number) {
    const pickedLocation: PlaceLocation = {
      lat,
      lng,
      address: null,
      staticMapImageUrl: null
    };
    this.isLoading = true;
    this.getAddress(lat, lng).pipe(switchMap(address =>{
        pickedLocation.address = address;
        return of(this.getMapImage(pickedLocation.lat, pickedLocation.lng, 14));
      })
    ).subscribe(staticMapImageUrl => {
      pickedLocation.staticMapImageUrl = staticMapImageUrl;
      this.selectedLocationImage = staticMapImageUrl;
      this.isLoading = false;
      this.locationPick.emit(pickedLocation);
    });
  }

  private getAddress(lat: number, lng: number) {
    // eslint-disable-next-line max-len
    return this.http.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyBNTud_CLJx8JAVBjqUGVhI3DybsnWZlrM`)
      .pipe(
        map((geoData: any) => {
          if (!geoData || !geoData.results || geoData.results.length === 0) {
            return null;
          }
          return geoData.results[0].formatted_address;
      }));
  }

  private getMapImage(lat: number, lng: number, zoom: number) {
    return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=500x300&maptype=roadmap
    &markers=color:red%7Clabel:Place%7C${lat},${lng}&key=AIzaSyBNTud_CLJx8JAVBjqUGVhI3DybsnWZlrM`;
  }
}
