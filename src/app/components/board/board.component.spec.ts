import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {BoardComponent} from './board.component';
import {ImageSetLoaderComponent} from '../image-set-loader/image-set-loader.component';
import {SvgdefService} from '../../service/svgdef.service';
import {HttpClientModule} from '@angular/common/http';

describe('BoardComponent', () => {
	let component: BoardComponent;
	let fixture: ComponentFixture<BoardComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [ImageSetLoaderComponent, BoardComponent],
			imports: [HttpClientModule],
			providers: [SvgdefService]
		})
			.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(BoardComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
