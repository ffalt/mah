import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';
import {MockComponent} from 'ng-mocks';
import {LayoutPreviewComponent} from '../layout-preview/layout-preview.component';
import {DurationPipe} from '../../pipes/duration.pipe';
import {LayoutService} from '../../../../service/layout.service';
import {LayoutListComponent} from './layout-list.component';

describe('ChooseLayoutComponent', () => {
	let component: LayoutListComponent;
	let fixture: ComponentFixture<LayoutListComponent>;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			declarations: [LayoutListComponent, MockComponent(LayoutPreviewComponent), DurationPipe],
			imports: [FormsModule, HttpClientTestingModule, TranslateModule.forRoot()],
			providers: [LayoutService]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(LayoutListComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', async () => {
		expect(component).toBeTruthy();
	});

});
