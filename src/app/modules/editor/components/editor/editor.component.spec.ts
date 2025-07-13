import { provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { LayoutService } from '../../../../service/layout.service';
import { EditorComponent } from './editor.component';

describe('EditorComponent', () => {
	let component: EditorComponent;
	let fixture: ComponentFixture<EditorComponent>;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			imports: [EditorComponent, TranslateModule.forRoot()],
			providers: [provideHttpClient(), provideHttpClientTesting(), LayoutService]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(EditorComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', async () => {
		expect(component).toBeTruthy();
	});
});
