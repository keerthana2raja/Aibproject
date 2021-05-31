import { Component,OnDestroy,OnInit} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatTableDataSource} from '@angular/material/table';
import { MatSort} from '@angular/material/sort';
import { HttpParams } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiServicesService } from '../../services/api-services.service';
import { ActivatedRoute ,Router} from '@angular/router';





@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit {
  private unsubscribe: Subject<any> = new Subject<any>();
  displayedColumns = ['image', 'name', 'symbol', 'current_price','high_24h','low_24h','getdetails'];
  dataSource: any;
  constructor(private dataService: ApiServicesService,private router: Router) { }
  ngOnInit(): void {
    this.getCoins()
  }
  
  /**
  * getting coins list.
  **/
  getCoins() {
    const params = new HttpParams()
     .set('vs_currency', 'EUR')
     .set('order', 'market_cap_desc')
     .set('per_page', '10');
     let url = `coins/markets`;
     this.dataService.get(url, params)
     .pipe(takeUntil(this.unsubscribe))
     .subscribe((data: any) => {
       this.dataSource = new MatTableDataSource<any>(data);
       });
    }

    /**
      * Redirect from one component to edit component.
    **/
  redirect(id:any)
    {
      this.router.navigate(['/editlist', id]);
    }
    
    /**
      * Destroy  the subscription before leaving component.
    **/
    ngOnDestroy() {
      this.unsubscribe.next();
      this.unsubscribe.complete();
      this.unsubscribe.unsubscribe();
    }
  }
  
   
 
 


