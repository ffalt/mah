import { DurationPipe } from './duration.pipe';

describe('DurationPipe', () => {
	it('create an instance', () => {
		const pipe = new DurationPipe();
		expect(pipe).toBeTruthy();
	});
	it('formats durations', () => {
		const pipe = new DurationPipe();
		expect(pipe.transform(0)).toEqual('-');
		expect(pipe.transform(1)).toEqual('00:00');
		expect(pipe.transform(999)).toEqual('00:00');
		expect(pipe.transform(1000)).toEqual('00:01');
		expect(pipe.transform(60 * 1000)).toEqual('01:00');
		expect(pipe.transform(60 * 60 * 1000)).toEqual('01:00:00');
		expect(pipe.transform(60 * 60 * 60 * 1000)).toEqual('60:00:00');
		expect(pipe.transform(55555 * 60 * 60 * 1000)).toEqual('55555:00:00');
	});
});
