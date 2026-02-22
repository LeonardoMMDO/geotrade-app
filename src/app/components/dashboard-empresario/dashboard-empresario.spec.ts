import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardEmpresario } from './dashboard-empresario';

describe('DashboardEmpresario', () => {
  let component: DashboardEmpresario;
  let fixture: ComponentFixture<DashboardEmpresario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardEmpresario]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardEmpresario);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
