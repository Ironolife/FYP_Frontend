import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SummarizerComponent } from './summarizer.component';

const routes: Routes = [
  { path: '', component: SummarizerComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SummarizerRoutingModule { }
