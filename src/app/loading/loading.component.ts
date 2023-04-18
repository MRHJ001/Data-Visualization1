import { Component, OnInit } from '@angular/core';
import { AppService } from '../services/app.service';
import { GeoService } from '../services/geo.service';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { animate, style, transition, trigger } from '@angular/animations';
import { NgxSpinnerService } from "ngx-spinner";

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss'],
  animations: [
    trigger('myAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('1s', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('1s', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class LoadingComponent implements OnInit {
  loadinMessage: any;
  sortedChart: any;
  
  constructor(private appService: AppService,
    private geoService: GeoService,
    private spinner: NgxSpinnerService) { }

  async ngOnInit() {
    this.spinner.show();
    this.loadinMessage = 'Loading city-hex-polygons-8-10.geojson data';
    try {
      const spatialDataLoaded = await this.appService.loadSpatialData();
      console.log(spatialDataLoaded); // should log 'true'
      this.loadinMessage = 'Loading sr_hex.csv data';
      const csvDataLoaded = await this.appService.convertCsvToJson();
      console.log(csvDataLoaded); // should log the converted CSV data
      this.loadinMessage = 'Loading Subarb Color Polygons';
      await this.createSuburbColorPolygonsMapLayer();
      this.loadinMessage = 'Loading Suburb Polygons';
      await this.createSuburbPolygonsMapLayer();
      this.loadinMessage = 'Create list of unique Directorate';
      this.appService.uniqueDirectorateList = [...new Set(this.appService.SR_Hex_Map.map((item: { directorate: any; }) => item.directorate))];
      this.appService.uniqueDirectorateList = this.appService.uniqueDirectorateList.sort((a: string, b: string) => a.localeCompare(b));
      this.appService.uniqueSuburbList = [...new Set(this.appService.SR_Hex_Map.map((item: { official_suburb: any; }) => item.official_suburb))];
      this.appService.uniqueSuburbList = this.appService.uniqueSuburbList.sort((a: string, b: string) => a.localeCompare(b));
      this.loadinMessage = 'Create list of list that is grouped by Directorate';
      await this.createListGroupedDirectorateList();
      this.loadinMessage = 'Create Code Points';
      await this.createListGroupedDirectorateAndCodePoints();//////
      this.loadinMessage = 'Create list of list that is grouped by Directorate and Suburb';
      await this.createListGroupedDirectorateAndSuburbList();
      this.loadinMessage = 'Create list of unique Suburb';
      
      
      this.loadinMessage = 'Create list of list that is grouped by Directorate, Suburb and Code';
      await this.createListGroupedDirectorateAndSuburbCodeList();
      this.loadinMessage = 'Create chart data for WATER AND SANITATION directorate';
      
      await this.createChartDataToShow();
      this.loadinMessage = 'Sorting Chart Data high to low';
      await this.sortChartDataHighToLow();
      this.loadinMessage = 'There are to much suburbs for a chart. Take the top 50';
      await this.sliceChartDataTop50();
      this.appService.setReloadGraphDataValue(true);
      this.spinner.hide();

      

    } catch (error) {
      console.error(error); // handle the error here
    }
  }

  createSuburbColorPolygonsMapLayer() {
    return new Promise<boolean>((resolve, reject) => {
      this.appService.MapPolygonGEOJsonData = this.geoService.createPolygonFeaturesFromData(this.appService.listPolygonMapData, true);
      this.geoService.createLayerFromGeoJson(this.appService.MapPolygonGEOJsonData, 'Suburb Boundaries Color', 0, 14);
      resolve(true);
    });
  }

  createSuburbPolygonsMapLayer() {
    return new Promise<boolean>((resolve, reject) => {
      this.appService.MapPolygonGEOJsonData = this.geoService.createPolygonFeaturesFromData(this.appService.listPolygonMapData, false);
      this.geoService.createLayerFromGeoJson(this.appService.MapPolygonGEOJsonData, 'Suburb Boundaries', 14, 18)
      resolve(true);
    });
  }

  createChartDataToShow() {
    return new Promise<boolean>((resolve, reject) => {
      

      const codePointsToShow = this.appService.DirectorateCodeList.filter((obj: { Directorate: string}) => {
        return obj.Directorate === 'WATER AND SANITATION' ;
      })

      const codePointsNotToShow = this.appService.DirectorateCodeList.filter((obj: { Directorate: string}) => {
        return obj.Directorate != 'WATER AND SANITATION' ;
      })

      const layers = this.geoService.map.getLayers().getArray();

      layers.forEach(element => {
        const layerNameValue = element.get('name');
        const name = typeof layerNameValue === 'object' ? layerNameValue['code'] : layerNameValue;
        if(codePointsToShow.find(row => row[name] === name))
        {
          element.setVisible(true);
        }
        if(codePointsNotToShow.find(row => row[name] === name))
        {
          console.log(name);
          element.setVisible(false);
        }
      });
      let baseLayer = this.geoService.map.getLayers().getArray().find(layer => layer instanceof TileLayer);
      if(baseLayer != undefined)
      {
        baseLayer.setVisible(true);
      }
      this.geoService.map.getView().setZoom(10);
      this.appService.ChartDataToShow = this.appService.groupedByDirectorateSuburbList.filter((obj: { Directorate: string}) => {
        return obj.Directorate === 'WATER AND SANITATION' ;
      })

      let layer = this.geoService.map.getLayers().getArray().find(layer => layer.get('id') === 'Suburb Boundaries Color');
      if(layer != undefined)
      {
        if (layer instanceof VectorLayer) {
          layer.getSource().forEachFeature((feature: any) => {
            // Get the ID of the feature
            let featureId = feature.get('properties').id;

            const returnValue = this.appService.SR_Hex_Map.find((record: any) => record.h3_level8_index === featureId);
            const suburbName = returnValue ? returnValue.official_suburb : undefined;
            const style = feature.getStyle();
            style.getText().setText(suburbName);
            const text = style.getText();
            text.setText(suburbName);
            // const subText = text.getText();
            // subText.setText(suburbName);

            feature.setStyle(style);
            //feature.setStyle(style);
          });
        }
      }
      resolve(true)
    });
  }

  sortChartDataHighToLow() {
    return new Promise<boolean>((resolve, reject) => {
      this.sortedChart = this.appService.ChartDataToShow.sort((a, b) => b.length - a.length);
      resolve(true);
    });
  }

  

  sliceChartDataTop50() {
    return new Promise<boolean>(async (resolve, reject) => {
      this.appService.ChartDataToShow = [];
      this.appService.ChartDataToShow = this.sortedChart.slice(0, 50);

      const selectedSuburb = this.appService.ChartDataToShow[0].Suburb;
      this.appService.selectedSuburb = selectedSuburb;
      await this.createSuburbChartDataToShow(selectedSuburb, 'WATER AND SANITATION');
      await this.sortChartSubertDataHighToLow();
      resolve(true);
    });
  }

  sortChartSubertDataHighToLow() {
    return new Promise<boolean>((resolve, reject) => {
      this.appService.ChartSubertDataToShow = this.appService.ChartSubertDataToShow.sort((a, b) => b.length - a.length);
      resolve(true);
    });
  }
  

  createSuburbChartDataToShow(Suburb: any, directorate:any) {
    return new Promise<boolean>((resolve, reject) => {
      this.appService.ChartSubertDataToShow = this.appService.groupedByDirectorateSuburbCodeItems.filter((obj: { Suburb: string, Directorate : string}) => {
        return obj.Suburb === Suburb && obj.Directorate === directorate ;
      })
      resolve(true)
    });
  }

  createListGroupedDirectorateList() {
    return new Promise<boolean>((resolve, reject) => {
      //Create a list grouped by directorate
      this.appService.groupedByDirectorateItems = this.appService.SR_Hex_Map.reduce((result: { [x: string]: any[]; }, item: { directorate: any; }) => {
        const category = item.directorate;
        if (!result[category]) {
          result[category] = [];
        }
        result[category].push(item);
        return result;
      }, {})
      resolve(true);
    });
  }

  createListGroupedDirectorateAndSuburbList() {
    return new Promise<boolean>((resolve, reject) => {
      //Create a list grouped by directorate
      // Create a list grouped by directorate and official_suburb
      const itemsByDirectorateSuburbCode = this.appService.SR_Hex_Map.reduce((result: { [x: string]: any[]; }, item: { directorate: any; official_suburb: any}) => {
        const category = item.directorate + ':' + item.official_suburb;
        if (!result[category]) {
          result[category] = [];
        }
        result[category].push(item);
        return result;
      }, {})

      
      for (const category in itemsByDirectorateSuburbCode) {
        const items = itemsByDirectorateSuburbCode[category]; // gets the items array for the category
        const Directorate = items[0].directorate;
        const Suberb = items[0].official_suburb;
        const length = items.length;
        const index = items[0].h3_level8_index;
        const long = this.appService.listPolygonMapData.find(l => l.index === items[0].h3_level8_index)?.long;
        const lat = this.appService.listPolygonMapData.find(l => l.index === items[0].h3_level8_index)?.lat;
        const borderColor = this.appService.listPolygonMapData.find(l => l.index === items[0].h3_level8_index)?.BorderColor;
        const backgroundColor = this.appService.listPolygonMapData.find(l => l.index === items[0].h3_level8_index)?.BorderColor;
        this.appService.groupedByDirectorateSuburbList.push({
          DirectorateSuburb: category,
          Directorate:Directorate,
          Suburb:Suberb,
          length: length,
          long: long,
          lat: lat,
          borderColor:borderColor,
          backgroundColor:backgroundColor
        });
      }
      resolve(true);
    });
  }

  createListGroupedDirectorateAndSuburbCodeList() {
    return new Promise<boolean>(async (resolve, reject) => {
      this.appService.itemsByDirectorateSuburbCode = this.appService.SR_Hex_Map.reduce((result: { [x: string]: any[]; }, item: { directorate: any; official_suburb: any; code:any}) => {
        const category = item.directorate + ':' + item.official_suburb+ ':' + item.code;
        if (!result[category]) {
          result[category] = [];
        }
        result[category].push(item);
        return result;
      }, {})
      // Build a list to show in graph with total of data per directorate and official_suburb
      for (const category in this.appService.itemsByDirectorateSuburbCode) {
        const items = this.appService.itemsByDirectorateSuburbCode[category]; // gets the items array for the category
        const Directorate = items[0].directorate;
        const Suberb = items[0].official_suburb;
        const code = items[0].code;
        const length = items.length;
        const index = items[0].h3_level8_index;
        const long = this.appService.listPolygonMapData.find(l => l.index === items[0].h3_level8_index)?.long;
        const lat = this.appService.listPolygonMapData.find(l => l.index === items[0].h3_level8_index)?.lat;
        const borderColor = this.appService.DirectorateCodeList.find(l => l.items === items[0].code)?.borderColor;
        const backgroundColor = this.appService.DirectorateCodeList.find(l => l.items === items[0].code)?.backgroundColor;
        this.appService.groupedByDirectorateSuburbCodeItems.push({
          DirectorateSuburb: category,
          Directorate:Directorate,
          Suburb:Suberb,
          code: code,
          length: length,
          long: long,
          lat: lat,
          borderColor:borderColor,
          backgroundColor:backgroundColor
        });
        //  const geoJsonData = this.geoService.createPointFeaturesFromData(items, backgroundColor, borderColor);
       
        // await this.createPoints(geoJsonData, items[0].code, 14, 18);
      }
      resolve(true);
    });
  }

  createListGroupedDirectorateAndCodePoints() {
    return new Promise<boolean>(async (resolve, reject) => {
      //Create a list grouped by directorate
      // Create a list grouped by directorate and official_suburb

      const itemsByDirectorateCode = this.appService.SR_Hex_Map.reduce((result: { [x: string]: any[]; }, item: { directorate: any; code: any}) => {
        const category = item.directorate + ':' + item.code;
        if (!result[category]) {
          result[category] = [];
        }
        result[category].push(item);
        return result;
      }, {})


      for (const category in itemsByDirectorateCode) {
        const items = itemsByDirectorateCode[category]; // gets the items array for the category
        const color = this.appService.getRandomColor();
        const borderColor = color[0];
        const backgroundColor = color[1];
        const geoJsonData = this.geoService.createPointFeaturesFromData(items, backgroundColor, borderColor);
          this.appService.DirectorateCodeList.push({Directorate: items[0].directorate, 
                                          items: items[0].code, 
                                          name: items[0].directorate+'-'+items[0].code,
                                          borderColor: borderColor,
                                          backgroundColor: backgroundColor,
                                          geoJsonData:geoJsonData})
       await this.createPoints(geoJsonData, items[0].directorate+'-'+items[0].code, 15, 18)
      }
      resolve(true);
    });
  }

  createPoints(geoJsonData: any, items: any, minZoom: any, maxZoom:any) {
    return new Promise<boolean>((resolve, reject) => {
       this.geoService.createLayerFromGeoJson(geoJsonData, items, minZoom, maxZoom)
      resolve(true);
    });
  }

}
