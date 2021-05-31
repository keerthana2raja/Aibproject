import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EditListComponent } from './component/edit-list/edit-list.component';
import { ListComponent } from './component/list/list.component';


const routes: Routes = [{
  path:'editlist/:id',component:EditListComponent
},{
  path:'',component:ListComponent
}];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
