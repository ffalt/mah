import { provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { LayoutService } from '../../../../service/layout.service';
import { LayoutComponent } from './layout.component';

describe('LayoutComponent', () => {
	let component: LayoutComponent;
	let fixture: ComponentFixture<LayoutComponent>;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			imports: [LayoutComponent, TranslateModule.forRoot()],
			providers: [provideHttpClient(), provideHttpClientTesting(), LayoutService]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(LayoutComponent);
		fixture.componentRef.setInput('layout', undefined);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', async () => {
		expect(component).toBeTruthy();
	});
});
