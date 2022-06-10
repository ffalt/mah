import {getDrawViewPort, mappingToDrawItems} from './draw';
import {Mapping} from './types';

export function generateStaticLayoutSVG(mapping: Mapping): string {
	const items = mappingToDrawItems(mapping);
	const viewport = getDrawViewPort(items, 1470, 960);
	const sl: Array<string> = [];
	sl.push(`<svg xmlns="http://www.w3.org/2000/svg" class="board-svg" viewBox="${viewport}" preserveAspectRatio="xMidYMid meet" height="100%" width="100%">`);
	for (const draw of items) {
		sl.push(`<g transform="${draw.pos.translate}"><rect class="stone" fill="#FFF9E5" stroke-width="2" stroke="black" x="0" y="0" width="75" height="100" rx="10" ry="10"></rect></g>`);
	}
	sl.push('</svg>');
	return `data:image/svg+xml;base64,${window.btoa(sl.join(''))}`;
}
