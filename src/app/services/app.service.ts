import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Papa } from 'ngx-papaparse';

interface GeoJSON {
  type: string;
  features: any[];
}
@Injectable()
export class AppService {
  SR_Hex_Raw: any;
  SR_Hex_Map: any;
  loadingDataDone: boolean = false;
  uniqueDirectorateList: any;
  selectedDirectorate: any = 'WATER AND SANITATION';;
  selectedSuburb: any
  uniqueSuburbList: any;
  listPolygonMapData:any[] = [];
  uniqueMapData:any[] = [];
  MapPolygonGEOJsonData: GeoJSON = { type: '',features: [] }
  MapPolylineGEOJsonData: GeoJSON = { type: '',features: [] }
  groupedByDirectorateItems:any;
  groupedByDirectorateSuburbItems:any;
  groupedByDirectorateSuburbCodeItems:any[] = [];
  itemsByDirectorateSuburbCode: any[] = [];
  groupedByDirectorateSuburbList:any[] = [];
  DirectorateCodeList: any[] = [];
  ChartDataToShow: any[] = [];
  ChartSubertDataToShow: any[] = [];
  usedColors: any[]= [];
  readonly controlsState = new BehaviorSubject<boolean>(false);
  reloadGraphData: BehaviorSubject<boolean>;

  constructor(private papa: Papa, 
    private http: HttpClient) { 
    this.reloadGraphData = new BehaviorSubject<boolean>(false);
  }

  getReloadGraphDataValueValue(): Observable<boolean> {
    return this.reloadGraphData.asObservable();
  }

  setReloadGraphDataValue(newValue: boolean): void {
    this.reloadGraphData.next(newValue);
  }

  loadSpatialData(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.http.get('assets/city-hex-polygons-8-10.geojson').subscribe((data) => {
        const jsonString = JSON.stringify(data);
        const json = JSON.parse(jsonString);
        let features: any[] = [];
        features = json.features; 
        features.forEach(element => {
          const colours = this.getRandomColor()
          this.listPolygonMapData.push({
            "index": element.properties.index,
            "name": "Suburbs", 
            "long": element.properties.centroid_lon,
            "lat": element.properties.centroid_lat,
            "PolyCordinates": element.geometry.coordinates,
            "BorderColor": colours[1],
            "BackgroundColor": colours[0]
          });
        });
        resolve(true);
      }, error => {
        reject(error);
      });
    });
  }

  convertCsvToJson(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.http.get('assets/sr_hex.csv', { responseType: 'text' })
      .subscribe(
        data => {
          this.papa.parse(data,{
            header: true,
            complete: async (result) => {
              this.SR_Hex_Raw = result.data;
              this.SR_Hex_Map = await this.SR_Hex_Raw.filter((obj: { longitude: string, directorate: string; }) => {
                return obj.longitude != '' && obj.directorate != '';
              });
              this.listPolygonMapData = await this.filterArrayByCommonColumn(this.listPolygonMapData, this.SR_Hex_Raw, 'index', 'h3_level8_index');

              
              resolve(true);
            }
          });
        },
        error => {
          reject(error);
        }
      )
    });
  }

  

  convertCsvToJson1() {
    //Get the excell sheet and import data into project
    this.http.get('assets/sr_hex.csv', { responseType: 'text' })
      .subscribe(
        data => {
          //Parse csv data to array
          
          this.papa.parse(data,{
            header: true,  //Add header to each record
            //If data is don loading
            complete: async (result) => {
                //Set a global varianle to all the raw data
                this.SR_Hex_Raw = await result.data;

                //Filter the main list to only show where directorate and and longitude is not null
                this.SR_Hex_Map = await this.SR_Hex_Raw.filter((obj: { longitude: string, directorate:string; }) => {
                  return obj.longitude != '' && obj.directorate != '';
                });
                return true;
            }
          });
        },
        error => {
          console.error(error);
        }
      );
  }

  getRandomColor() {
    let Colours: any[] = [];
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);

    Colours.push(`rgba(${r}, ${g}, ${b}, ${0.5})`)
    Colours.push(`rgba(${r}, ${g}, ${b}, ${1})`)
    return Colours;
  }

  filterArrayByCommonColumn(array1:any, array2:any, array1CommonColumnName: string, array2CommonColumnName: string) {
    const lookup = array2.reduce((obj: { [x: string]: boolean; }, row: { [x: string]: string | number; }) => {
      obj[row[array2CommonColumnName]] = true;
      return obj;
    }, {});
  
    return array1.filter((row: { [x: string]: string | number; }) => lookup[row[array1CommonColumnName]]);
  }
}
