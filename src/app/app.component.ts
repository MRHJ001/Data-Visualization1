import { AfterViewInit, Component } from '@angular/core';
import { AppService } from './services/app.service';
import { HttpClient } from '@angular/common/http';
import { GeoService } from './services/geo.service';
import { Papa } from 'ngx-papaparse';
import { Polygon } from 'ol/geom';

export class MyData {
  DirectorateSuburb: any | undefined;
  Directorate: any | undefined;
  Suburb: any | undefined;
  length: any | undefined;
  long: any | undefined;
  lat: any | undefined;
  color:any| undefined;
}
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements AfterViewInit {
  title = 'Data_Visualisation';
  colors :any[] = []
  constructor(public appService: AppService,
    private papa: Papa, 
    private http: HttpClient,
    private geoService: GeoService,) {}
  ngAfterViewInit(): void {

  }

  onCheckboxChange(event: any, code: string, directorate: string) {
    if(directorate != '')
    {
      const layerName = directorate+'-'+code;
  
      const layers = this.geoService.map.getLayers().getArray();
      const LayerToToggle = layers.find(layer => layer.get('name') === layerName);
      console.log('Layer to toggle:', LayerToToggle);

      if (LayerToToggle !== undefined) {
        LayerToToggle.setVisible(event.checked);
        console.log('Layer visibility set to:', event.checked);
      } else {
        console.log('Layer not found!');
      }
    }else{
      const layerName = code;
  
      const layers = this.geoService.map.getLayers().getArray();
      const LayerToToggle = layers.find(layer => layer.get('name') === layerName);
      console.log('Layer to toggle:', LayerToToggle);

      if (LayerToToggle !== undefined) {
        LayerToToggle.setVisible(event.checked);
        console.log('Layer visibility set to:', event.checked);
      } else {
        console.log('Layer not found!');
      }
    }
    
   }
}
