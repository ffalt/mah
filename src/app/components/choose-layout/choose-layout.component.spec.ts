import { provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { LayoutService } from '../../service/layout.service';
import { CoreModule } from '../../modules/core/core.module';
import { GAME_MODE_EASY } from '../../model/consts';
import { ChooseLayoutComponent } from './choose-layout.component';

describe('ChooseLayoutComponent', () => {
	let component: ChooseLayoutComponent;
	let fixture: ComponentFixture<ChooseLayoutComponent>;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			declarations: [ChooseLayoutComponent],
			imports: [CoreModule, TranslateModule.forRoot()],
			providers: [provideHttpClient(), provideHttpClientTesting(), LayoutService]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(ChooseLayoutComponent);
		fixture.componentRef.setInput('gameMode', GAME_MODE_EASY);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', async () => {
		expect(component).toBeTruthy();
	});

});
