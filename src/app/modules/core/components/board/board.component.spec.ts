import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { MockComponent } from 'ng-mocks';
import { TranslateModule } from '@ngx-translate/core';
import { PrefixPipe } from '../../pipes/prefix.pipe';
import { ImageSetLoaderComponent } from '../image-set-loader/image-set-loader.component';
import { SvgdefService } from '../../../../service/svgdef.service';
import { AppService } from '../../../../service/app.service';
import { BoardComponent } from './board.component';

describe('BoardComponent', () => {
	let component: BoardComponent;
	let fixture: ComponentFixture<BoardComponent>;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			declarations: [BoardComponent, PrefixPipe, MockComponent(ImageSetLoaderComponent)
			],
			imports: [TranslateModule.forRoot()],
			providers: [SvgdefService, AppService]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(BoardComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', async () => {
		expect(component).toBeTruthy();
	});
});
