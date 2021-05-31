import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import {HttpClientModule} from '@angular/common/http';
import { ApiServicesService } from './api-services.service';

describe('ApiServicesService', () => {
  let service: ApiServicesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiServicesService]

    });
    service = TestBed.inject(ApiServicesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
