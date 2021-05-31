import { Component, OnInit,OnDestroy } from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatTableDataSource} from '@angular/material/table';
import { takeUntil } from 'rxjs/operators';
import { ApiServicesService } from '../../services/api-services.service';
import {ActivatedRoute} from '@angular/router';
import { Subject } from 'rxjs';


@Component({
  selector: 'app-edit-list',
  templateUrl: './edit-list.component.html',
  styleUrls: ['./edit-list.component.css']
})
export class EditListComponent implements OnInit {
  private unsubscribe: Subject<any> = new Subject<any>();
  displayedColumns = ['name', 'symbol','hashing_algorithm','market_cap','description','links','genesis_date'];
  dataSource: any;
  coinId:any
  constructor(private dataService: ApiServicesService,private route : ActivatedRoute) { }

  ngOnInit(): void {
    this.route.params.
    subscribe(params => {
      this.coinId=params.id
    });
    this.getCoinDetails()
}
 /**
  * get count details by passing  the id.
**/
getCoinDetails() {
    const url = `coins/${this.coinId}`;
    this.dataService.get(url)
    .pipe(takeUntil(this.unsubscribe))
    .subscribe((data: any) => {
      let dataSource = Object.entries(data).map(([k, v]) => ({ [k]: v }));
      let mappedData = dataSource.reduce(function(result, current) {
      return Object.assign(result, current);
      }, {});
      this.dataSource = new MatTableDataSource([mappedData]);
});
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
