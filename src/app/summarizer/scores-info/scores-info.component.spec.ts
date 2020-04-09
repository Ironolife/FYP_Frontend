import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ScoresInfoComponent } from './scores-info.component';

describe('ScoresInfoComponent', () => {
  let component: ScoresInfoComponent;
  let fixture: ComponentFixture<ScoresInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ScoresInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ScoresInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
