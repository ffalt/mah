import { provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { MockComponent } from 'ng-mocks';
import { CoreModule } from '../../../core/core.module';
import { LayoutService } from '../../../../service/layout.service';
import { ManagerComponent } from '../manager/manager.component';
import { EditorComponent } from './editor.component';

describe('EditorComponent', () => {
	let component: EditorComponent;
	let fixture: ComponentFixture<EditorComponent>;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			declarations: [EditorComponent, MockComponent(ManagerComponent)],
			imports: [CoreModule, TranslateModule.forRoot()],
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
