import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {NgPipesModule} from 'ngx-pipes';
import { BrowserModule } from '@angular/platform-browser';
import { NgChartsModule } from 'ng2-charts';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MapComponent } from './map/map.component';
import { AppService } from './services/app.service';
import { GeoService } from './services/geo.service';
import { HttpClientModule } from '@angular/common/http';
import { ChartComponent } from './chart/chart.component';
import { LoadingComponent } from './loading/loading.component';
import { NgxSpinnerModule } from "ngx-spinner";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSidenavModule } from '@angular/material/sidenav';
import { SidebarComponent } from './sidebar/sidebar.component'; 
import { MatIconModule } from '@angular/material/icon';  
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';


@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
    ChartComponent,
    LoadingComponent,
    SidebarComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    NgChartsModule,
    FormsModule,
    NgPipesModule,
    NgxSpinnerModule,
    MatSidenavModule,
    MatIconModule,
    MatToolbarModule,
    MatListModule,
    MatCheckboxModule
  ],
  providers: [GeoService,
              AppService],
  bootstrap: [AppComponent]
})
export class AppModule { }
