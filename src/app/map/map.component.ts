import { AfterViewInit, Component, OnInit } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { GeoService } from '../services/geo.service';
import { Subscription } from 'rxjs';
import { AppService } from '../services/app.service';
import { HttpClient } from '@angular/common/http';
import { Papa } from 'ngx-papaparse';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import { OSM } from 'ol/source';
import TileLayer from 'ol/layer/Tile';
import * as ol from 'ol';
@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements AfterViewInit {
  constructor(private appService: AppService, 
              private geoService: GeoService,
              private papa: Papa, 
              private http: HttpClient) {
    
  }

 ngAfterViewInit(): void {
  this.geoService.updateView(10, 10, 18, [18.843266, -34.075691]);
  this.geoService.setTileSource();
  this.geoService.updateSize();
}


 getLayerDetail(event: any){
  
}
}