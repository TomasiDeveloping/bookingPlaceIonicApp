import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Place} from '../../place.model';
import {PlacesService} from '../../places.service';
import {NavController} from '@ionic/angular';

@Component({
  selector: 'app-edit-offer',
  templateUrl: './edit-offer.page.html',
  styleUrls: ['./edit-offer.page.scss'],
})
export class EditOfferPage implements OnInit {

  place: Place;

  constructor(private route: ActivatedRoute, private placeService: PlacesService, private navCtr: NavController) { }

  ngOnInit() {
    this.route.paramMap.subscribe(paramMap => {
      if (!paramMap.has('placeId')) {
        this.navCtr.navigateBack('/places/tabs/offers').then();
        return;
      }
      this.place = this.placeService.getPlace(paramMap.get('placeId'));
    });
  }

}
