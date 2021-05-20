import { Injectable } from '@angular/core';
import {Place} from './place.model';
import {AuthService} from '../auth/auth.service';
import {BehaviorSubject, of} from 'rxjs';
import {map, switchMap, take, tap} from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';
import {PlaceLocation} from './location.model';
//
// [
//   new Place(
//     'p1',
//     'Manhattan Mansion',
//     'In the heart of New York City.',
//     // eslint-disable-next-line max-len
// eslint-disable-next-line max-len
//     'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwallup.net%2Fwp-content%2Fuploads%2F2017%2F03%2F15%2F66638-sunset-New_York_City-Manhattan.jpg&f=1&nofb=1',
//     149.99,
//     new Date('2021-01-01'),
//     new Date('2021-12-31'),
//     'abc'
//   ),
//   new Place(
//     'p2',
//     'L\'Amour Toujours',
//     'A romantic place in Paris!',
//     // eslint-disable-next-line max-len
//     'https://www.mustgo.com/wp-content/uploads/2018/04/par_320a.jpg',
//     189.99,
//     new Date('2021-01-01'),
//     new Date('2021-12-31'),
//     'abc'
//   ),
//   new Place(
//     'p3',
//     'The Foggy Palace',
//     'Not your average city trip!',
//     // eslint-disable-next-line max-len
// eslint-disable-next-line max-len
//     'https://images.fineartamerica.com/images/artworkimages/mediumlarge/3/the-alhambra-palace-generalife-autumn-foggy-sunrise-guido-montanes-castillo.jpg',
//     99.99,
//     new Date('2021-01-01'),
//     new Date('2021-12-31'),
//     'abc'
//   )
// ]

interface PlaceData {
  availableFrom: string;
  availableTo: string;
  description: string;
  imageUrl: string;
  price: number;
  title: string;
  userId: string;
  location: PlaceLocation;
}

@Injectable({
  providedIn: 'root'
})
export class PlacesService {

  private _places = new BehaviorSubject<Place[]>( []);

  get places() {
    // eslint-disable-next-line no-underscore-dangle
    return this._places.asObservable();
  }

  constructor(private authService: AuthService, private http: HttpClient) { }

  fetchPlaces() {
    return this.authService.token.pipe(take(1),switchMap(token => this.http.get<{[key: string]: PlaceData}>
      (`https://ionic-angular-course-be70c-default-rtdb.firebaseio.com/offred-places.json?auth=${token}`)),map(resData => {
        const places = [];
        for (const key in resData) {
          if (resData.hasOwnProperty(key)) {
            places.push(
              new Place(
                key,
                resData[key].title,
                resData[key].description,
                resData[key].imageUrl,
                resData[key].price,
                new Date(resData[key].availableFrom),
                new Date(resData[key].availableTo),
                resData[key].userId,
                resData[key].location
              )
            );
          }
        }
        //return [];
        return places;
      }),
        tap(places => {
          // eslint-disable-next-line no-underscore-dangle
          this._places.next(places);
        })
        );
  }

  getPlace(placeId: string) {
    return this.authService.token.pipe(take(1), switchMap(token =>
      this.http.get<PlaceData>(`https://ionic-angular-course-be70c-default-rtdb.firebaseio.com/offred-places/${placeId}.json?auth=${token}`)
    ), map(placeData => new Place(
            placeId,
            placeData.title,
            placeData.description,
            placeData.imageUrl,
            placeData.price,
            new Date(placeData.availableFrom),
            new Date(placeData.availableTo),
            placeData.userId,
            placeData.location))
      );
  }

  uploadImage(image: File) {
    const uploadData = new FormData();
    uploadData.append('image', image);

    return this.authService.token.pipe(take(1), switchMap(token => this.http.post<{imageUrl: string; imagePath: string}>
      ('https://us-central1-ionic-angular-course-be70c.cloudfunctions.net/storeImage', uploadData,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        {headers: {Authorization: 'Bearer ' + token}})));
  }

  addPlace(title: string, description: string, price: number, dateFrom: Date, dateTo: Date, location: PlaceLocation, imageUrl: string) {
    let generatedId: string;
    let newPlace: Place;
    let fetchedUserId: string;
    return this.authService.userId.pipe(take(1)
      ,switchMap(userId => {
        fetchedUserId = userId;
        return this.authService.token;
      }),take(1)
      ,switchMap(token => {
      if (!fetchedUserId) {
        throw new Error('No user Found');
      }
      newPlace = new Place(Math.random().toString(), title, description, imageUrl,
        price, dateFrom, dateTo, fetchedUserId, location);
      return this.http.post<{name: string}>
      (`https://ionic-angular-course-be70c-default-rtdb.firebaseio.com/offred-places.json?auth=${token}`,
        { ...newPlace, id: null});
    }),
        switchMap(resData => {
          generatedId = resData.name;
          return this.places;
        }),
        take(1),
        tap(places => {
          newPlace.id =generatedId;
          // eslint-disable-next-line no-underscore-dangle
          this._places.next(places.concat(newPlace));
        })
      );
  }

  updatePlace(placeId: string, title: string, description: string) {
    let updatedPlaces: Place[];
    let fetchedToken: string;
    return this.authService.token.pipe(take(1), switchMap(token => {
      fetchedToken = token;
      return this.places;
    }),
      take(1),
      switchMap(places => {
        if (!places || places.length <= 0) {
          return this.fetchPlaces();
        } else {
          return of(places);
        }
      }),
      switchMap(places => {
        const updatePlaceIndex = places.findIndex(pl => pl.id === placeId);
        updatedPlaces = [...places];
        const oldPlace = updatedPlaces[updatePlaceIndex];
        updatedPlaces[updatePlaceIndex] =
          // eslint-disable-next-line max-len
          new Place(oldPlace.id, title, description, oldPlace.imageUrl, oldPlace.price, oldPlace.availableFrom, oldPlace.availableFrom, oldPlace.userId, oldPlace.location);
        return     this.http.put(
          `https://ionic-angular-course-be70c-default-rtdb.firebaseio.com/offred-places/${placeId}.json?auth=${fetchedToken}`,
          {...updatedPlaces[updatePlaceIndex], id: null}
        );
      })
        , tap(() => {
        // eslint-disable-next-line no-underscore-dangle
        this._places.next(updatedPlaces);
      })
    );
  }
}
