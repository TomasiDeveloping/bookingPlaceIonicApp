import { Injectable } from '@angular/core';
import {Booking} from './booking.model';
import {BehaviorSubject} from 'rxjs';
import {AuthService} from '../auth/auth.service';
import {map, switchMap, take, tap} from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';

interface BookingData {
  bookedFrom: string;
  bookedTo: string;
  firstName: string;
  lastName: string;
  placeId: string;
  placeImage: string;
  guestNumber: number;
  placeTitle: string;
  userId: string;
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {

  private _bookings = new BehaviorSubject<Booking[]>([]);

  get bookings() {
    // eslint-disable-next-line no-underscore-dangle
    return this._bookings.asObservable();
  }

  constructor(private authService: AuthService, private http: HttpClient) { }

  addBooking(placeId: string,
             placeTitle: string,
             placeImage: string,
             firstName: string,
             lastName: string,
             guestNumber: number,
             dateFrom: Date,
             dateTo: Date
  ) {
    let generatedId: string;
    let newBooking: Booking;
    let fetchedUserId: string;
    return this.authService.userId.pipe(
      take(1),
      switchMap(userId => {
        if (!userId) {
          return;
        }
        fetchedUserId = userId;
        return this.authService.token;
      }),
      take(1),
      switchMap(token => {
        newBooking = new Booking(
          Math.random().toString(),
          placeId,
          fetchedUserId,
          placeTitle,
          placeImage,
          firstName,
          lastName,
          guestNumber,
          dateFrom,
          dateTo
        );
        return this.http.post<{name: string}>(`https://ionic-angular-course-be70c-default-rtdb.firebaseio.com/bookings.json?auth=${token}`,
          {...newBooking, id: null});
      }),
      switchMap(resData => {
        generatedId = resData.name;
        return this.bookings;
      })
      ,take(1)
      ,tap(bookings => {
        newBooking.id = generatedId;
        // eslint-disable-next-line no-underscore-dangle
        this._bookings.next(bookings.concat(newBooking));
      })
    );
  }

  cancelBooking(bookingId: string) {
    return this.authService.token.pipe(take(1), switchMap(token => this.http
        .delete(`https://ionic-angular-course-be70c-default-rtdb.firebaseio.com/bookings/${bookingId}.json?auth=${token}`)),
      switchMap(() => this.bookings),
        take(1)
        ,tap(bookings => {
        // eslint-disable-next-line no-underscore-dangle
        this._bookings.next(bookings.filter(b => b.id !== bookingId));
      }));
  }

  fetchBookings() {
    let fetchedUserId: string;
    return this.authService.userId.pipe(take(1),switchMap(userId => {
      if (!userId) {
        throw new Error('No user Found');
      }
      fetchedUserId = userId;
      return this.authService.token;
    }), take(1),
      switchMap(token => this.http.get<{[key: string]: BookingData}>(
        // eslint-disable-next-line max-len
          `https://ionic-angular-course-be70c-default-rtdb.firebaseio.com/bookings.json?orderBy="userId"&equalTo="${fetchedUserId}"&auth=${token}`
        )),map(bookingData => {
      const bookings = [];
      for (const key in bookingData) {
        if (bookingData.hasOwnProperty(key)) {
          bookings.push(new Booking(
            key,
            bookingData[key].placeId,
            bookingData[key].userId,
            bookingData[key].placeTitle,
            bookingData[key].placeImage,
            bookingData[key].firstName,
            bookingData[key].lastName,
            bookingData[key].guestNumber,
            new Date(bookingData[key].bookedFrom),
            new Date(bookingData[key].bookedTo)
            )
          );
        }
      }
      return bookings;
    }),
      tap(bookings => {
        // eslint-disable-next-line no-underscore-dangle
        this._bookings.next(bookings);
      })
    );
  }
}
