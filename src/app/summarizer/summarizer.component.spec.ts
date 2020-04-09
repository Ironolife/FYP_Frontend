import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SummarizerComponent } from './summarizer.component';

describe('SummarizerComponent', () => {
  let component: SummarizerComponent;
  let fixture: ComponentFixture<SummarizerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SummarizerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SummarizerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
