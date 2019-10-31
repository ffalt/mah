/***
 https://github.com/tjoskar/ng-lazyload-image/blob/master/src/rect.ts

 The MIT License (MIT)

 Copyright (c) 2016 Oskar Karlsson

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */

export class Rect {
	static empty: Rect = new Rect(0, 0, 0, 0);
	left: number;
	top: number;
	right: number;
	bottom: number;

	constructor(left: number, top: number, right: number, bottom: number) {
		this.left = left;
		this.top = top;
		this.right = right;
		this.bottom = bottom;
	}

	static fromElement(element: HTMLElement): Rect {
		const {left, top, right, bottom} = element.getBoundingClientRect();
		return new Rect(left, top, right, bottom);
	}

	static fromWindow(_window: Window): Rect {
		return new Rect(0, 0, _window.innerWidth, _window.innerHeight);
	}

	inflate(inflateBy: number): void {
		this.left -= inflateBy;
		this.top -= inflateBy;
		this.right += inflateBy;
		this.bottom += inflateBy;
	}

	intersectsWith(rect: Rect): boolean {
		return (rect.left < this.right) &&
			(this.left < rect.right) &&
			(rect.top < this.bottom) &&
			(this.top < rect.bottom);
	}

	intersectsWithY(rect: Rect): boolean {
		return (rect.top < this.bottom) &&
			(this.top < rect.bottom);
	}

	getIntersectionWith(rect: Rect): Rect {
		const left = Math.max(this.left, rect.left);
		const top = Math.max(this.top, rect.top);
		const right = Math.min(this.right, rect.right);
		const bottom = Math.min(this.bottom, rect.bottom);

		if (right >= left && bottom >= top) {
			return new Rect(left, top, right, bottom);
		}
		return Rect.empty;
	}

}
