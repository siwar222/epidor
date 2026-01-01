import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgvComponent } from './agv.component';

describe('AgvComponent', () => {
  let component: AgvComponent;
  let fixture: ComponentFixture<AgvComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AgvComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgvComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
