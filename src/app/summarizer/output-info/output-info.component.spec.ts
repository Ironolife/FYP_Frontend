import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OutputInfoComponent } from './output-info.component';

describe('OutputInfoComponent', () => {
  let component: OutputInfoComponent;
  let fixture: ComponentFixture<OutputInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OutputInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OutputInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
