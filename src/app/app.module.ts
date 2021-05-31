import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatCardModule, } from '@angular/material/card';
import { MatButtonModule} from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { ListComponent } from './component/list/list.component';
import { MatPaginatorModule } from "@angular/material/paginator";
import {MatTableModule} from '@angular/material/table';
import {HttpClientModule} from '@angular/common/http';
import { EditListComponent } from './component/edit-list/edit-list.component';
import{ ApiServicesService} from './services/api-services.service'



@NgModule({
  declarations: [
    AppComponent,
    ListComponent,
    EditListComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatCardModule,
    MatButtonModule,
    MatMenuModule,
    MatToolbarModule,
    MatIconModule,
    MatPaginatorModule,
    MatTableModule,
    HttpClientModule
  ],
  providers: [ApiServicesService],
  bootstrap: [AppComponent]
})
export class AppModule { }
