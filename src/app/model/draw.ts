import {Stone} from './stone';

export interface DrawPos {
	x: number;
	y: number;
	z: number;
	translate: string;
}

export interface Draw {
	x: number;
	y: number;
	z: number;
	v: number;
	pos: DrawPos;
	visible: boolean;
	url?: string;
	source: Stone;
}
