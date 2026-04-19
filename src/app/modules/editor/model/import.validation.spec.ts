import { isValidLoadLayout, isValidMahFormat } from './import';

describe('isValidLoadLayout', () => {
	it('should return true for a valid LoadLayout', () => {
		expect(isValidLoadLayout({ id: 'abc', name: 'Test', map: [] })).toBe(true);
	});

	it('should return true when optional fields are present', () => {
		expect(isValidLoadLayout({ id: 'abc', name: 'Test', cat: 'cat', by: 'author', map: [[0, []]] })).toBe(true);
	});

	it('should return false for null', () => {
		expect(isValidLoadLayout(null)).toBe(false);
	});

	it('should return false for undefined', () => {
		expect(isValidLoadLayout(undefined)).toBe(false);
	});

	it('should return false for an array', () => {
		expect(isValidLoadLayout([])).toBe(false);
	});

	it('should return false for a primitive', () => {
		expect(isValidLoadLayout('string')).toBe(false);
		expect(isValidLoadLayout(42)).toBe(false);
	});

	it('should return false when id is missing', () => {
		expect(isValidLoadLayout({ name: 'Test', map: [] })).toBe(false);
	});

	it('should return false when id is not a string', () => {
		expect(isValidLoadLayout({ id: 123, name: 'Test', map: [] })).toBe(false);
	});

	it('should return false when name is missing', () => {
		expect(isValidLoadLayout({ id: 'abc', map: [] })).toBe(false);
	});

	it('should return false when name is not a string', () => {
		expect(isValidLoadLayout({ id: 'abc', name: 42, map: [] })).toBe(false);
	});

	it('should return false when map is missing', () => {
		expect(isValidLoadLayout({ id: 'abc', name: 'Test' })).toBe(false);
	});

	it('should return false when map is not an array', () => {
		expect(isValidLoadLayout({ id: 'abc', name: 'Test', map: 'invalid' })).toBe(false);
		expect(isValidLoadLayout({ id: 'abc', name: 'Test', map: {} })).toBe(false);
	});
});

describe('isValidMahFormat', () => {
	const validBoard = { id: 'abc', name: 'Test', map: [] };

	it('should return true for a valid MahFormat', () => {
		expect(isValidMahFormat({ mah: '1.0', boards: [validBoard] })).toBe(true);
	});

	it('should return true for an empty boards array', () => {
		expect(isValidMahFormat({ mah: '1.0', boards: [] })).toBe(true);
	});

	it('should return false for null', () => {
		expect(isValidMahFormat(null)).toBe(false);
	});

	it('should return false for undefined', () => {
		expect(isValidMahFormat(undefined)).toBe(false);
	});

	it('should return false for an array', () => {
		expect(isValidMahFormat([])).toBe(false);
	});

	it('should return false when mah version is wrong', () => {
		expect(isValidMahFormat({ mah: '2.0', boards: [] })).toBe(false);
		expect(isValidMahFormat({ mah: 1, boards: [] })).toBe(false);
	});

	it('should return false when mah field is missing', () => {
		expect(isValidMahFormat({ boards: [] })).toBe(false);
	});

	it('should return false when boards is missing', () => {
		expect(isValidMahFormat({ mah: '1.0' })).toBe(false);
	});

	it('should return false when boards is not an array', () => {
		expect(isValidMahFormat({ mah: '1.0', boards: {} })).toBe(false);
		expect(isValidMahFormat({ mah: '1.0', boards: 'invalid' })).toBe(false);
	});

	it('should return false when any board is invalid', () => {
		const invalidBoard = { id: 'abc', name: 'Test' }; // missing map
		expect(isValidMahFormat({ mah: '1.0', boards: [validBoard, invalidBoard] })).toBe(false);
	});

	it('should return false when a board has wrong field types', () => {
		const badBoard = { id: 123, name: 'Test', map: [] };
		expect(isValidMahFormat({ mah: '1.0', boards: [badBoard] })).toBe(false);
	});

	it('should return false for prototype pollution payload', () => {
		expect(isValidMahFormat(JSON.parse('{"mah":"1.0","boards":[],"__proto__":{"polluted":true}}'))).toBe(true);
		// Verify the payload did not pollute Object.prototype
		expect((({} as Record<string, unknown>).polluted)).toBeUndefined();
	});
});
