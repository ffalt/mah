export const RANDOM_LAYOUT_ID_PREFIX = 'random-';
export const X_MAX = 36;
export const Y_MAX = 16;
export const Z_MAX = 5; // 0..5 (6 layers) but we typically use up to 3-4
export const TARGET_COUNT = 144;
export type RandomBaseLayerMode = 'random' | 'checker' | 'lines' | 'rings' | 'areas';
export type RandomSymmetry = 'random' | 'true' | 'false';
export interface BaseLayerOptions {
	minTarget: number;
	maxTarget: number;
	xMax: number;
	yMax: number;
}
