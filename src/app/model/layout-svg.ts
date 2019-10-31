import {Consts} from './consts';
import {Mapping} from './layouts';

interface DrawPos {
	x: number;
	y: number;
	z: number;
	translate: string;
}

interface Item {
	x: number;
	y: number;
	z: number;
	pos: DrawPos;
}

function calcPos(z: number, x: number, y: number): DrawPos {
	const pos = {
		x: ((Consts.tile_width + 2) * x / 2 - (z * 8)) + (Consts.tile_width / 2),
		y: ((Consts.tile_height + 2) * y / 2 - (z * 8)) + (Consts.tile_height / 2),
		z: y + Consts.mY * (x + Consts.mX * z),
		translate: ''
	};
	pos.translate = `translate(${pos.x},${pos.y})`;
	return pos;
}

function calcBounds(elements: Array<Item>): Array<number> {
	const m = Math.max(1470, 960);
	const bounds = [m, m, 0, 0];
	elements.forEach(draw => {
		bounds[0] = Math.min(bounds[0], draw.pos.x);
		bounds[1] = Math.min(bounds[1], draw.pos.y);
		bounds[2] = Math.max(bounds[2], draw.pos.x);
		bounds[3] = Math.max(bounds[3], draw.pos.y);
	});
	return bounds;
}

export function generateStaticLayoutSVG(mapping: Mapping): string {
	const sortToDraw = (draw: Item) => draw.pos.z;
	const elements = mapping.map((row: Array<number>) =>
		({
			z: row[0],
			x: row[1],
			y: row[2],
			pos: calcPos(row[0], row[1], row[2])
		})).sort((ad: Item, bd: Item) => {
		const a = sortToDraw(ad);
		const b = sortToDraw(bd);
		if (a < b) {
			return -1;
		}
		if (a > b) {
			return 1;
		}
		return 0;
	});
	const bounds = calcBounds(elements);
	const viewport = [bounds[0] - 40, bounds[1] - 20, bounds[2] + Consts.tile_height + 40, bounds[3] + Consts.tile_height + 20].join(' ');
	const sl: Array<string> = [];
	sl.push(`<svg xmlns="http://www.w3.org/2000/svg" class="board-svg" viewBox="${viewport}" preserveAspectRatio="xMidYMid meet" height="100%" width="100%">`);
	for (const draw of elements) {
		sl.push(`<g transform="${draw.pos.translate}"><rect class="stone" fill="#FFF9E5" stroke-width="2" stroke="black" x="0" y="0" width="75" height="100" rx="10" ry="10"></rect></g>`);
	}
	sl.push('</svg>');
	return 'data:image/svg+xml;base64,' + window.btoa(sl.join(''));
}
