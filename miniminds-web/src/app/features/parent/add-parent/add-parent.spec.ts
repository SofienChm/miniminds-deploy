import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddParent } from './add-parent';

describe('AddParent', () => {
  let component: AddParent;
  let fixture: ComponentFixture<AddParent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddParent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddParent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
