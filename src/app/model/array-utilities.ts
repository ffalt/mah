export function shuffleArray<T>(array: Array<T>): Array<T> {
	for (let index = array.length - 1; index > 0; index--) {
		const swapIndex = Math.floor(Math.random() * (index + 1));
		[array[index], array[swapIndex]] = [array[swapIndex], array[index]];
	}
	return array;
}

export function shuffledCopy<T>(array: Array<T>): Array<T> {
	return shuffleArray([...array]);
}

export function randomIndex<T>(array: Array<T>): number {
	return Math.floor(Math.random() * array.length);
}

export function randomExtract<T>(array: Array<T>): T {
	const index = randomIndex(array);
	return array.splice(index, 1)[0];
}
