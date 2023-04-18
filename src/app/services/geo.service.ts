import { interval } from 'rxjs';
import { takeWhile } from 'rxjs/operators';

import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import ZoomToExtent from 'ol/control/ZoomToExtent';
import FullScreen from 'ol/control/FullScreen';
import Attribution from 'ol/control/Attribution';
import OsmSource from 'ol/source/OSM';
import StamenSource from 'ol/source/Stamen';
import VectorSource from 'ol/source/Vector';
import DragAndDrop from 'ol/interaction/DragAndDrop';
import GeoJSON from 'ol/format/GeoJSON';
import { fromLonLat } from 'ol/proj';
import Point from 'ol/geom/Point';
import Polyline from 'ol/format/Polyline.js';
import { Polygon } from 'ol/geom';
import { defaults as defaultControls } from 'ol/control';
import { defaults as defaultInteractions, PinchZoom } from 'ol/interaction';
import { Injectable } from '@angular/core';
import { AppService } from '../services/app.service';
import { Collection, Feature } from 'ol';
import { Geometry } from 'ol/geom';
import { Style, Fill, Stroke, Text } from 'ol/style';
import Icon from 'ol/style/Icon';
import { style } from '@angular/animations';
import * as ol from 'ol';
import { FeatureCollection, Feature as GEO_Feature, Polygon as GEO_Polygon, Point as GEO_Point} from 'geojson';
import { FeatureLike } from 'ol/Feature';
import Layer from 'ol/renderer/Layer';
import CircleStyle from 'ol/style/Circle';

// import * as GeoJSON from 'geojson';
//import { Vector } from '../models/vector';

@Injectable()
export class GeoService {

  tileSources = [
    { name: 'None', source: null },
    { name: 'OSM', source: new OsmSource() },
    { name: 'Stamen', source: new StamenSource({ layer: 'toner' }) }
  ];
  delay = 1000;
  chunkSize = 1000;
  selectedTileSource = this.tileSources[1];
  featureClicked:any;
  //vectorSources: Vector[] = [];
  features: Feature[] = [];
  totalLabelLayerFeature: Feature[] = [];
  suburbPolegonLayerFeature : Feature[] = [];
  map: Map;
  private readonly tileLayer: TileLayer<OsmSource>;
  private readonly vectorLayer: VectorLayer<any>;
  private directorateLayer: VectorLayer<any>;
  private totalLabelLayer: VectorLayer<any>;
  private suburbPolegonLayer: VectorLayer<any>;
  
  private readonly extent = [1980215.5005561742,-4084832.228904729,2215030.0514482358,-3993107.794962517];

  constructor(private appService: AppService) {

    this.tileLayer = new TileLayer();
    this.vectorLayer = new VectorLayer<any>();
    this.directorateLayer = new VectorLayer<any>();
    this.totalLabelLayer = new VectorLayer<any>();
    this.suburbPolegonLayer = new VectorLayer<any>();

    this.map = new Map({
      interactions: defaultInteractions().extend([
        new PinchZoom()
      ]),
      layers: [
        this.tileLayer,
        this.vectorLayer,
        this.directorateLayer,
        this.totalLabelLayer,
        this.suburbPolegonLayer
      ],
      view: new View({
        constrainResolution: true
      }),
      controls: defaultControls().extend([
        new Attribution(),
        new ZoomToExtent({ extent: this.extent }),
        new FullScreen()
      ])
    });
    const view = this.map.getView();

    this.featureClicked = this.map.on('click', (evt) => {
                          const feature = this.map.forEachFeatureAtPixel(evt.pixel, (feature: any, layer: any) => {
                            if (feature) {

                              const layerName = feature.get('properties').name;
                              const textStyle = feature.getStyle().getText();
                              const text = textStyle ? textStyle.getText() : '';
                              if(layerName === 'Suburb Boundaries Color')
                              {
                                this.appService.selectedSuburb = text;
                                this.appService.setReloadGraphDataValue(true);
                              }
                              console.log(`Clicked on feature with layer name: ${layerName} and text: ${text}`);
                            }
                            return feature;
                          });
    
      
    });
  }

  /**
   * Updates zoom and center of the view.
   * @param zoom Zoom.
   * @param center Center in long/lat.
   */
  updateView(zoom :any, minzoom:any, maxzoom:any, center: [number, number]): void {
    this.map.getView().setZoom(zoom);
    this.map.getView().setMaxZoom(maxzoom);
    this.map.getView().setMinZoom(minzoom);
    this.map.getView().setCenter(fromLonLat(center));
  }

  /**
   * Updates target and size of the map.
   * @param target HTML container.
   */
  updateSize(target = 'map'): void {
    this.map.setTarget(target);
    this.map.updateSize();
  }

  reloadMap()
  {
    this.directorateLayer.getSource().clear();
    this.features = [];
  }

  /**
   * Sets the source of the tile layer.
   * @param source Source.
   */
  setTileSource(source = this.selectedTileSource): void {
    this.selectedTileSource = source;
    this.tileLayer.setSource(source.source);

    
  }

  getExtend(){
    this.map.getView().calculateExtent(this.map.getSize())
      // Nowadays, map.getSize() is optional most of the time (except if you don't share view between different maps), so above is equivalent to the following
      console.log(this.map.getView().calculateExtent());
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

  createPolygonFeaturesFromData(data: any[], addStyle:boolean) {
    let newFeatures: any[] = [];
    data.forEach(element => {
        const coordinates = element.PolyCordinates;
        const textLabel = element.index;
        const id = element.index;
        const name = element.name;
        let feature:any;
        if(addStyle)
        {
           feature = {
            "type": "Feature",
            "properties": {
              "id": id,
              "name": name
            },
            "geometry": {
              "type": "Polygon",
              "coordinates": coordinates
            },
            "style":{
              "fill":element.BackgroundColor,
              "stroke-color": element.BorderColor,
              "stroke-width": 1,
              "text-font": '14px Calibri,sans-serif',
              "text-fill":'rgba(0, 0, 0, 1)',
              "text": element.index
              }
          };
        }else{
          feature = {
            "type": "Feature",
            "properties": {
              "id": id,
              "name": name
            },
            "geometry": {
              "type": "Polygon",
              "coordinates": coordinates
            },
            "style":{

              }
            };
        }
        
      
      
      newFeatures.push(feature);
    })
    const geojson = {
      "type": "FeatureCollection",
      "features": newFeatures
    };
    return geojson;
  }

  createPolylineFeaturesFromData(data: any[]) {
    let newFeatures: any[] = [];
    data.forEach(element => {
        const coordinates = element.PolyCordinates;
        const id = element.index;
        const name = element.name;
        const colours = this.getRandomColor()
        const feature = {
          "type": "Feature",
          "properties": {
            "id": id,
            "name": name
          },
          "geometry": {
            "type": "LineString",
            "coordinates": coordinates
          },
          "style":{
            "stroke-color": 'colours[0]',
            "stroke-width": 1,
            }
        };
      
      newFeatures.push(feature);
    })
    const geojson = {
      "type": "FeatureCollection",
      "features": newFeatures
    };
    let GeoSting = JSON.stringify(geojson);
    console.log(GeoSting);
    return geojson;
  }

  createPointFeaturesFromData(data: any[], backgroundColor:any, borderColor:any) {
    let newFeatures: any[] = [];
    data.forEach(element => {
        const long = element.longitude;
        const lat = element.latitude;
        const newFeature = {
          "type": "Feature",
          "properties": {
            "id": element.reference_number,
            "backgroundColor": backgroundColor,
            "borderColor": borderColor,
            "text": element.reference_number,
            "text-font": '14px Calibri,sans-serif'
          },
          "geometry": {
            "type": "Point",
            "coordinates":  [long, lat]
          }
          
        };
      newFeatures.push(newFeature);
    })
  
    const geojson = {
      "type": "FeatureCollection",
      "features": newFeatures
    };
    return geojson;
  }

  setLayerVisibility(vissible:boolean, layerName:string) 
  {
    let myLayer = this.map.getLayers().getArray().find(function(layer) {
      return layer.get('name') === layerName;
    });
    if (myLayer != undefined){
      myLayer.setVisible(vissible);
    }
  }
  createLayerFromGeoJson(geojsonData:any, layerName:any, minZoom: any, maxZoom:any)
  {
    let vectorSource = new VectorSource();

    let vectorLayer = new VectorLayer({
      source: vectorSource
    });

    geojsonData.features.forEach((feature: { geometry: any; properties: any; style:any}) => {

      let geometry = new GeoJSON().readGeometry(feature.geometry);
      //Transform from the EPSG:4326 coordinate system to the EPSG:3857 coordinate system
      geometry = geometry.transform('EPSG:4326', 'EPSG:3857');
      let properties = feature.properties;
      properties.name = layerName;
      // layerName = properties.name;
      const style = feature.style;

      const vectorFeature = new Feature({
        geometry,
        properties
      });

      if(feature.geometry.type == "Polygon")
      {
        if(Object.entries(style).length != 0)
        {
          const createStyle = new Style({
            stroke: new Stroke({
              color: style['stroke-color'],
              width: style['stroke-width']
            }),
            fill: new Fill({
              color: style['fill']
            }),
            text: new Text({
              text: style['text'],
              font: style['text-font'],
              fill: new Fill({
                color: style['text-fill']
              })
            })
        });
         vectorFeature.setStyle(createStyle);
        }
      }else if(feature.geometry.type == "Point")
      {

        const createStyle = new Style({
          image: new CircleStyle({
            fill: new Fill({
              color: properties.backgroundColor
            }),
            radius: 3
          })
      });
        vectorFeature.setStyle(createStyle);
      }
      
      vectorSource.addFeature(vectorFeature);
    });
    vectorLayer = new VectorLayer({
      source: vectorSource
    });
    vectorLayer.set('name', layerName);
    vectorLayer.set('id', layerName);
    vectorLayer.set('maxZoom', maxZoom);
    vectorLayer.set('minZoom', minZoom);

    this.map.addLayer(vectorLayer);
    // Retrieve the layer by ID and set it to a variable
  
  }

  checkLayerExists(layerName: string): boolean {
    const layers = this.map.getLayers().getArray();
    return layers.some(layer => layer.getProperties()['name'] === layerName);
  }

  hideCodePoints(codePointsNotToShow: any) {
    const layers = this.map.getLayers().getArray();
    codePointsNotToShow.forEach((element: { code: string; }) => {
      layers.forEach(layer => {
        if (layer.get('name') === element.code) {
          if (layer instanceof TileLayer || layer instanceof VectorLayer) {
            this.setLayerVisibility(false, element.code);
          }
        }
      });
    });
  }


  layerZoomVissible(layerName: string) {
    const layers = this.map.getLayers().getArray();
    let layer = this.map.getLayers().getArray().find(function(layer) {
      return layer.get('id') === layerName;
    });
    if (layer) {
      if (layer instanceof VectorLayer) {
        const source = layer.getSource();
        if (source) {
          const extent = layer.getSource().getExtent();
          return extent;
        }
      }
    }
  }

  getCurrentZoom()
  {
    const view = this.map.getView();
    const currentZoom = view.getZoom();
    return currentZoom;
  }

checkLayervisible(layerName:any){
  const layers = this.map.getLayers().getArray();
  let myLayer = this.map.getLayers().getArray().find(function(layer) {
    return layer.get('id') === layerName;
  });
  if (myLayer) {
    const isVisible = myLayer.getVisible();
    if (isVisible) {
      return true
    } else {
      return false
    }
  } else {
    return false
  }
}
  

  refreshLayer(layerName: string) {
    const layers = this.map.getLayers().getArray();
    const layer = layers.find(l => l.get('name') === layerName);
    if (layer) {
      if (layer instanceof TileLayer) {
        const source = layer.getSource();
        if (source) {
          source.changed();
        }
      } else if (layer instanceof VectorLayer) {
        const source = layer.getSource();
        if (source) {
          source.refresh();
        }
      }
    }
  }
}
