import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {TranslateModule} from '@ngx-translate/core';
import {MockComponent} from 'ng-mocks';
import {CoreModule} from '../../../core/core.module';
import {LayoutService} from '../../../../service/layout.service';
import {ManagerComponent} from '../manager/manager.component';
import {EditorComponent} from './editor.component';

describe('EditorComponent', () => {
	let component: EditorComponent;
	let fixture: ComponentFixture<EditorComponent>;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			declarations: [EditorComponent,
				MockComponent(ManagerComponent)
			],
			imports: [HttpClientTestingModule, CoreModule, TranslateModule.forRoot()],
			providers: [LayoutService]
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
