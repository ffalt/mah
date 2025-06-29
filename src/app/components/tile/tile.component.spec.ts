import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { SvgdefService } from '../../service/svgdef.service';
import { CoreModule } from '../../modules/core/core.module';
import { TileComponent } from './tile.component';

describe('TileComponent', () => {
	let component: TileComponent;
	let fixture: ComponentFixture<TileComponent>;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			declarations: [TileComponent],
			imports: [CoreModule, TranslateModule.forRoot()],
			providers: [provideHttpClient(), provideHttpClientTesting(), SvgdefService]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(TileComponent);
		fixture.componentRef.setInput('tile', '');
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', async () => {
		expect(component).toBeTruthy();
	});
});
