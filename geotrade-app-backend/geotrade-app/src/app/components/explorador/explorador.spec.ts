import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExploradorComponent } from './explorador';
import { GoogleMapsLoaderService } from '../../services/google-maps-loader.service';

describe('ExploradorComponent', () => {
  let component: ExploradorComponent;
  let fixture: ComponentFixture<ExploradorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExploradorComponent],
      providers: [
        { provide: GoogleMapsLoaderService, useValue: { load: () => Promise.resolve() } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExploradorComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
