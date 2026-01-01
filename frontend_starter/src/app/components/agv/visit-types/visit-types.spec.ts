import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisitTypesComponent } from './visit-types';

describe('VisitTypesComponent', () => {
  let component: VisitTypesComponent;
  let fixture: ComponentFixture<VisitTypesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VisitTypesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VisitTypesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
