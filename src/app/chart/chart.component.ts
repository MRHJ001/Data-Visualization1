import { Component, OnInit } from '@angular/core';
import { ChartOptions, ChartType, ChartDataset } from 'chart.js';
import { AppService } from '../services/app.service';
import { GeoService } from '../services/geo.service';
import TileLayer from 'ol/layer/Tile';


@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss']
})
export class ChartComponent implements OnInit {
  barChartOptions: ChartOptions = {
    responsive: true,
  };
  barChartSuburbOptions: ChartOptions = {
    responsive: true,
  };
  selectedDirectorate: any = 'WATER AND SANITATION';
  selectedSuburb: any = this.appService.selectedSuburb;
  uniqueDirectorateList: any;
  uniqueSuberbList: any;
  barChartLabels: any[] = [];
  barChartType: ChartType = 'bar';
  barChartLegend = false;
  barChartPlugins = [];
  barData:number[] = []
  barChartData: any[] = [
    { data: [], label: '' }
  ];

  barChartSuburbLabels: any[] = [];
  barChartSuburbType: ChartType = 'bar';
  barChartSuburbLegend = false;
  barChartSuburbPlugins = [];
  barSuburbData:number[] = []
  barChartSuburbData: any[] = [
    { data: [], label: '' }
  ];
  sortedChart: any;
  sortedSuberbChart:any;
  constructor(public appService: AppService,
    private geoService: GeoService) {
    this.appService.getReloadGraphDataValueValue().subscribe((value) => {
      if(value == true)
      {
        if(this.appService.selectedSuburb != this.selectedSuburb)
        {
          this.selectedSuburb = this.appService.selectedSuburb;
        }
        this.generateGraph();
        this.appService.setReloadGraphDataValue(false);
        
      }
    });
   }

  ngOnInit(): void {
    
  }

  generateGraph()
  {
    this.uniqueDirectorateList = this.appService.uniqueDirectorateList;
    this.uniqueSuberbList = this.appService.uniqueSuburbList;
    this.barChartData = [];
    this.barChartLabels = [];
    this.barData = [];
    let backgroundColor: any[] = [];
    let borderColor: any[] = []

    this.barChartSuburbData = [];
    this.barChartSuburbLabels = [];
    this.barSuburbData = [];
    let backgroundSuburbColor: any[] = [];
    let borderSuburbColor: any[] = []
    if(this.selectedSuburb == undefined)
    {
      this.selectedSuburb = this.appService.selectedSuburb;
    }
    
    for (const item of this.appService.ChartDataToShow) {
          
          //Populate Graph Labels
          this.barChartLabels.push(
              item.Suburb
          );
          //Populate Graph Data
          this.barData.push(item.length);
          backgroundColor.push(item.backgroundColor);
          borderColor.push(item.backgroundColor);
          

    }
    this.barChartData.push({
      data: this.barData, backgroundColor: backgroundColor, borderColor: borderColor, 
    });

    for (const item of this.appService.ChartSubertDataToShow) {
      //Populate Graph Labels
      this.barChartSuburbLabels.push(
          item.code
      );
      //Populate Graph Data
      this.barSuburbData.push(item.length);
      backgroundSuburbColor.push(item.backgroundColor);
      borderSuburbColor.push(item.backgroundColor);
    }
      
    this.barChartSuburbData.push({
      data: this.barSuburbData, backgroundColor: backgroundSuburbColor, borderColor: borderSuburbColor, 
  });
    
  }

  onChartClick(event: any){
    if (event.active.length > 0) {
      let index = event.active[0].index;
      let longitude = this.appService.ChartDataToShow[index].long;
      let latitude = this.appService.ChartDataToShow[index].lat;
      this.geoService.updateView(16.49, 10, 18, [longitude, latitude]);
    }
  };

  async onSuberbSelectChange(event: any) {
    this.selectedSuburb = event;
    this.appService.selectedSuburb = this.selectedSuburb;
    await this.createSuburbChartDataToShow(this.selectedSuburb, this.selectedDirectorate);
    await this.sortChartSubertDataHighToLow();
    this.appService.setReloadGraphDataValue(true);
    // Do something with the selected value
  }

  async onDirectorateSelectChange(event: any) {
    this.selectedDirectorate = event;
    await this.createChartDataToShow(this.selectedDirectorate);
      await this.sortChartDataHighToLow();
      await this.sliceChartDataTop50();
      this.selectedSuburb = this.appService.ChartDataToShow[0].Suburb;
      await this.createSuburbChartDataToShow(this.selectedSuburb, this.selectedDirectorate);
      await this.sortChartSubertDataHighToLow();
      this.appService.setReloadGraphDataValue(true);
    //this.appService.ChartDataToShow = sortedUsers.slice(0, 20);
    this.appService.selectedDirectorate = this.selectedDirectorate;
    this.appService.setReloadGraphDataValue(true);

    // Do something with the selected value
  }

  createChartDataToShow(directorate: any) {
    return new Promise<boolean>(async (resolve, reject) => {
      

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
        return obj.Directorate === directorate ;
      })
      
      resolve(true)
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

  sortChartDataHighToLow() {
    return new Promise<boolean>((resolve, reject) => {
      this.sortedChart = this.appService.ChartDataToShow.sort((a, b) => b.length - a.length);
      resolve(true);
    });
  }

  sortChartSubertDataHighToLow() {
    return new Promise<boolean>((resolve, reject) => {
      this.appService.ChartSubertDataToShow = this.appService.ChartSubertDataToShow.sort((a, b) => b.length - a.length);
      resolve(true);
    });
  }
  

  sliceChartDataTop50() {
    return new Promise<boolean>((resolve, reject) => {
      this.appService.ChartDataToShow = [];
      this.appService.ChartDataToShow = this.sortedChart.slice(0, 50);
      resolve(true);
    });
  }

  getRandomColor() {
    let Colours: any[] = [];
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    //const a = Math.random().toFixed(1); // generates a random alpha value between 0.0 and 1.0
    Colours.push(`rgba(${r}, ${g}, ${b}, ${0.5})`)
    Colours.push(`rgba(${r}, ${g}, ${b}, ${1})`)
    return Colours;
  }

}
