import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackRoom } from './track-room';

describe('TrackRoom', () => {
  let component: TrackRoom;
  let fixture: ComponentFixture<TrackRoom>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackRoom]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrackRoom);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
