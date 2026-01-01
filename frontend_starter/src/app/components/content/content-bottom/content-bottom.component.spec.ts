import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentBottomComponent } from './content-bottom.component';

describe('ContentBottomComponent', () => {
  let component: ContentBottomComponent;
  let fixture: ComponentFixture<ContentBottomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ContentBottomComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContentBottomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
