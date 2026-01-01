import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisitComponent } from './visit';

describe('VisitComponent', () => {
  let component: VisitComponent;
  let fixture: ComponentFixture<VisitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VisitComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VisitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
