import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SummarizerRoutingModule } from './summarizer-routing.module';
import { SummarizerComponent } from './summarizer.component';
import { OutputInfoComponent } from './output-info/output-info.component';
import { MatDialogModule } from '@angular/material/dialog';
import { ScoresInfoComponent } from './scores-info/scores-info.component';

import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  declarations: [SummarizerComponent, OutputInfoComponent, ScoresInfoComponent],
  imports: [
    CommonModule,
    SummarizerRoutingModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatDialogModule
  ]
})
export class SummarizerModule { }
