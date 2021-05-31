import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { ListComponent } from './component/list/list.component';
import { EditListComponent } from './component/edit-list/edit-list.component';
import {HttpClientModule} from '@angular/common/http';
import{ ApiServicesService} from './services/api-services.service'
import { MatMenuModule } from '@angular/material/menu';





describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientModule,
        MatMenuModule
      ],
      declarations: [
        AppComponent,
        ListComponent,
        EditListComponent
      ],
      providers: [ApiServicesService]

    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  
});
