import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Explorador } from './explorador';

describe('Explorador', () => {
  let component: Explorador;
  let fixture: ComponentFixture<Explorador>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Explorador]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Explorador);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
