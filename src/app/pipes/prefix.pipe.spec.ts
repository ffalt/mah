import { PrefixPipe } from './prefix.pipe';

describe('PrefixPipe', () => {
	it('create an instance', () => {
		const pipe = new PrefixPipe();
		expect(pipe).toBeTruthy();
	});
	it('prefixes strings', () => {
		const pipe = new PrefixPipe();
		expect(pipe.transform('b', 'a')).toEqual('ab');
		expect(pipe.transform('a', 'b')).toEqual('ba');
		expect(pipe.transform('b', 'c')).toEqual('cb');
	});
});
