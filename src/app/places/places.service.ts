import { Injectable } from '@angular/core';
import {Place} from './place.model';

@Injectable({
  providedIn: 'root'
})
export class PlacesService {

  private _places: Place[] = [
    new Place(
      'p1',
      'Manhattan Mansion',
      'In the heart of New York City.',
      // eslint-disable-next-line max-len
      'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwallup.net%2Fwp-content%2Fuploads%2F2017%2F03%2F15%2F66638-sunset-New_York_City-Manhattan.jpg&f=1&nofb=1',
      149.99
    ),
    new Place(
      'p2',
      'L\'Amour Toujours',
      'A romantic place in Paris!',
      // eslint-disable-next-line max-len
      'https://www.mustgo.com/wp-content/uploads/2018/04/par_320a.jpg',
      189.99
    ),
    new Place(
      'p3',
      'The Foggy Palace',
      'Not your average city trip!',
      // eslint-disable-next-line max-len
      'https://images.fineartamerica.com/images/artworkimages/mediumlarge/3/the-alhambra-palace-generalife-autumn-foggy-sunrise-guido-montanes-castillo.jpg',
      99.99
    )
  ];

  get places() {
    // eslint-disable-next-line no-underscore-dangle
    return [...(this._places)];
  }

  constructor() { }

  getPlace(placeId: string) {
    // eslint-disable-next-line no-underscore-dangle
    return {...this._places.find(p => p.id === placeId)};
  }
}
