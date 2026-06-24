import { ChangeDetectorRef } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';

/**
 * Mark the component-under-test for check, then run change detection.
 *
 * The Analog test compiler (@analogjs/vite-plugin-angular) compiles a component with an
 * unspecified change-detection strategy as OnPush, while the production Angular compiler
 * treats it as Default. Because of that a plain fixture.detectChanges() no longer re-runs
 * the template after a non-signal property mutation in tests. Marking the component's own
 * view for check first restores the expected re-render.
 */
export function markAndDetect<T>(fixture: ComponentFixture<T>): void {
	fixture.componentRef.injector.get(ChangeDetectorRef).markForCheck();
	fixture.detectChanges();
}
