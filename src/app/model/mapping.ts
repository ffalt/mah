import type { CompactMapping, CompactMappingX, Mapping, Place } from './types';
import { hashString } from './hash';
import { CONSTS } from './consts';

const MAX_REPEATED_CELLS = CONSTS.mX * 2;
const TILE_SPAN = 2;
const NEIGHBOUR_RANGE = TILE_SPAN - 1;

export type PlaceCollisionKind = 'duplicate' | 'overlap';

export interface PlaceCollision {
	kind: PlaceCollisionKind;
	place: Place;
	other: Place;
}

function isPlaceValue(value: unknown): boolean {
	return Number.isSafeInteger(value) && (value as number) >= 0;
}

function isValidCompactCells(cells: unknown): boolean {
	if (!Array.isArray(cells)) {
		return isPlaceValue(cells);
	}
	return (cells as Array<unknown>).every(cell =>
		(Array.isArray(cell) ? (cell.length === 2 && isPlaceValue(cell[0]) && isPlaceValue(cell[1])) : isPlaceValue(cell)));
}

function isValidCompactRow(row: unknown): boolean {
	return Array.isArray(row) && row.length === 2 && isPlaceValue(row[0]) && isValidCompactCells(row[1]);
}

function isValidCompactLevel(level: unknown): boolean {
	if (!Array.isArray(level) || level.length !== 2 || !isPlaceValue(level[0]) || !Array.isArray(level[1])) {
		return false;
	}
	return (level[1] as Array<unknown>).every(row => isValidCompactRow(row));
}

export function isValidCompactMapping(map: unknown): map is CompactMapping {
	return Array.isArray(map) && (map as Array<unknown>).every(level => isValidCompactLevel(level));
}

export function expandMapping(map: CompactMapping): Mapping {
	return map.flatMap(([z, rows]) =>
		rows.flatMap(([y, cells]) =>
			expandCells(z, y, cells)
		)
	);
}

function expandCells(z: number, y: number, cells: CompactMappingX): Array<Place> {
	// Handle single cell case
	if (!Array.isArray(cells)) {
		return [[z, cells, y]];
	}

	// Handle array of cells
	return cells.flatMap(cell =>
		Array.isArray(cell) ? expandRepeatedCells(z, y, cell[0], cell[1]) : [[z, cell, y]]
	);
}

function expandRepeatedCells(z: number, y: number, startX: number, count: number): Array<Place> {
	const length = Math.max(0, Math.min(count, MAX_REPEATED_CELLS));
	return Array.from(
		{ length },
		(_, index) => [z, startX + (index * 2), y] as Place
	);
}

function placeKey(z: number, x: number, y: number): string {
	return `${z}/${x}/${y}`;
}

function walkPlaceCollisions(mapping: Mapping, onCollision: (collision: PlaceCollision) => boolean): void {
	const occupied = new Map<string, Place>();
	for (const place of mapping) {
		const [z, x, y] = place;
		for (let dx = -NEIGHBOUR_RANGE; dx <= NEIGHBOUR_RANGE; dx++) {
			for (let dy = -NEIGHBOUR_RANGE; dy <= NEIGHBOUR_RANGE; dy++) {
				const other = occupied.get(placeKey(z, x + dx, y + dy));
				if (other && onCollision({ kind: dx === 0 && dy === 0 ? 'duplicate' : 'overlap', place, other })) {
					return;
				}
			}
		}
		occupied.set(placeKey(z, x, y), place);
	}
}

export function findPlaceCollisions(mapping: Mapping): Array<PlaceCollision> {
	const collisions: Array<PlaceCollision> = [];
	walkPlaceCollisions(mapping, collision => {
		collisions.push(collision);
		return false;
	});
	return collisions;
}

export function hasPlaceCollisions(mapping: Mapping): boolean {
	let collides = false;
	walkPlaceCollisions(mapping, () => {
		collides = true;
		return true;
	});
	return collides;
}

export function mappingToID(mapping: Mapping): string {
	return hashString(JSON.stringify(mapping)).toString();
}

export function mappingBounds(mapping: Mapping, minLevel: number, minX: number, minY: number): { x: number; y: number; z: number } {
	const bound = { x: minX, y: minY, z: minLevel };
	for (const place of mapping) {
		bound.z = Math.max(bound.z, place[0] + 1);
		bound.x = Math.max(bound.x, place[1] + 1);
		bound.y = Math.max(bound.y, place[2] + 1);
	}
	return bound;
}

export interface MappingExtents {
	minX: number;
	maxX: number;
	minY: number;
	maxY: number;
	minZ: number;
	maxZ: number;
}

export function mappingExtents(mapping: Mapping): MappingExtents {
	const extents: MappingExtents = {
		minX: 0, maxX: 0,
		minY: 0, maxY: 0,
		minZ: 0, maxZ: 0
	};
	if (mapping.length === 0) {
		return extents;
	}
	const [first] = mapping;
	extents.minZ = first[0];
	extents.maxZ = first[0];
	extents.minX = first[1];
	extents.maxX = first[1];
	extents.minY = first[2];
	extents.maxY = first[2];
	for (const place of mapping) {
		extents.minZ = Math.min(extents.minZ, place[0]);
		extents.maxZ = Math.max(extents.maxZ, place[0]);
		extents.minX = Math.min(extents.minX, place[1]);
		extents.maxX = Math.max(extents.maxX, place[1]);
		extents.minY = Math.min(extents.minY, place[2]);
		extents.maxY = Math.max(extents.maxY, place[2]);
	}
	return extents;
}
