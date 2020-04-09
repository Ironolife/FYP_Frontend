import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'summarizer', pathMatch: 'full' },
  { path: 'summarizer', loadChildren: () => import('./summarizer/summarizer.module').then(mod => mod.SummarizerModule) }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
