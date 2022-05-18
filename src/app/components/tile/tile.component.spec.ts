import {HttpClientModule} from '@angular/common/http';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {TranslateModule} from '@ngx-translate/core';
import {SvgdefService} from '../../service/svgdef.service';
import {CoreModule} from '../../modules/core/core.module';
import {TileComponent} from './tile.component';

describe('TileComponent', () => {
	let component: TileComponent;
	let fixture: ComponentFixture<TileComponent>;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			declarations: [TileComponent],
			imports: [HttpClientModule, CoreModule, TranslateModule.forRoot()],
			providers: [SvgdefService]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(TileComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', async () => {
		expect(component).toBeTruthy();
	});
});
