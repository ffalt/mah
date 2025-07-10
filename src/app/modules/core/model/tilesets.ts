export function imageSetIsKyodai(name: string): boolean {
	return ['kyodai', 'kyodai-black'].includes(name);
}

export interface Tileset {
	source: string;
	author?: string;
	name?: string;
}

export const KyodaiTileSets: Array<Tileset> = [
	{
		name: 'Traditional',
		author: 'My Kyodai Mahjongg',
		source: 'https://web.archive.org/web/20170903191758/https://kyodaimahjongg.weebly.com/uploads/9/5/2/9/9529146/79546_orig.jpg'
	},
	{
		name: 'Cards',
		author: 'My Kyodai Mahjongg',
		source: 'https://web.archive.org/web/20170903191753im_/http://kyodaimahjongg.weebly.com/uploads/9/5/2/9/9529146/4962942_orig.jpg'
	},
	{
		name: 'Board Games',
		author: 'My Kyodai Mahjongg',
		source: 'https://web.archive.org/web/20170903191753im_/http://kyodaimahjongg.weebly.com/uploads/9/5/2/9/9529146/3862268_orig.jpg'
	},
	{
		name: 'Motorcycles',
		author: 'My Kyodai Mahjongg',
		source: 'https://web.archive.org/web/20170903191753im_/http://kyodaimahjongg.weebly.com/uploads/9/5/2/9/9529146/8438984_orig.jpg'
	},
	{
		name: 'NHL',
		author: 'My Kyodai Mahjongg',
		source: 'https://web.archive.org/web/20170903191753im_/http://kyodaimahjongg.weebly.com/uploads/9/5/2/9/9529146/630927_orig.jpg'
	},
	{
		name: 'Social Media',
		author: 'My Kyodai Mahjongg',
		source: 'https://web.archive.org/web/20170903191753im_/http://kyodaimahjongg.weebly.com/uploads/9/5/2/9/9529146/241535_orig.jpg'
	},
	{
		name: 'Monopoly',
		author: 'My Kyodai Mahjongg',
		source: 'https://web.archive.org/web/20170903191753im_/http://kyodaimahjongg.weebly.com/uploads/9/5/2/9/9529146/9084861_orig.jpg'
	},
	{
		name: 'Horror Films',
		author: 'My Kyodai Mahjongg',
		source: 'https://web.archive.org/web/20170903191738im_/http://kyodaimahjongg.weebly.com/uploads/9/5/2/9/9529146/849930_orig.jpg'
	},
	{
		name: 'Animated Movies',
		author: 'My Kyodai Mahjongg',
		source: 'https://web.archive.org/web/20170903191738im_/http://kyodaimahjongg.weebly.com/uploads/9/5/2/9/9529146/2303366_orig.jpg'
	},
	{
		name: 'Stephen King',
		author: 'My Kyodai Mahjongg',
		source: 'https://web.archive.org/web/20170903191738im_/http://kyodaimahjongg.weebly.com/uploads/9/5/2/9/9529146/4168429_orig.jpg'
	},
	{
		name: 'Lord of the Rings',
		author: 'My Kyodai Mahjongg',
		source: 'https://web.archive.org/web/20170903191738im_/http://kyodaimahjongg.weebly.com/uploads/9/5/2/9/9529146/3966297_orig.jpg'
	},
	{
		name: '007',
		author: 'My Kyodai Mahjongg',
		source: 'https://web.archive.org/web/20170903191738im_/http://kyodaimahjongg.weebly.com/uploads/9/5/2/9/9529146/9617288_orig.jpg'
	},
	{
		name: 'Disney Princess',
		author: 'My Kyodai Mahjongg',
		source: 'https://web.archive.org/web/20170903191738im_/http://kyodaimahjongg.weebly.com/uploads/9/5/2/9/9529146/2281343_orig.jpg'
	},
	{
		name: 'Religions',
		author: 'My Kyodai Mahjongg',
		source: 'https://web.archive.org/web/20170903191748im_/http://kyodaimahjongg.weebly.com/uploads/9/5/2/9/9529146/2620625_orig.jpg'
	},
	{
		name: 'Happy Eastern',
		author: 'My Kyodai Mahjongg',
		source: 'https://web.archive.org/web/20170903191728im_/http://kyodaimahjongg.weebly.com/uploads/9/5/2/9/9529146/1396173_orig.jpg'
	},
	{
		name: 'Halloween',
		author: 'My Kyodai Mahjongg',
		source: 'https://web.archive.org/web/20170903191728im_/http://kyodaimahjongg.weebly.com/uploads/9/5/2/9/9529146/8455923_orig.jpg'
	},
	{
		name: 'Neck Ties',
		author: 'My Kyodai Mahjongg',
		source: 'https://web.archive.org/web/20170903191728im_/http://kyodaimahjongg.weebly.com/uploads/9/5/2/9/9529146/9349600_orig.jpg'
	},
	{
		name: 'Floral',
		author: 'My Kyodai Mahjongg',
		source: 'https://web.archive.org/web/20170903191728im_/http://kyodaimahjongg.weebly.com/uploads/9/5/2/9/9529146/3178635_orig.jpg'
	},
	{
		name: 'Easter Eggs',
		author: 'My Kyodai Mahjongg',
		source: 'https://web.archive.org/web/20170903191728im_/http://kyodaimahjongg.weebly.com/uploads/9/5/2/9/9529146/8685131_orig.jpg'
	},
	{
		name: 'St. Patricks Day',
		author: 'My Kyodai Mahjongg',
		source: 'https://web.archive.org/web/20170903191728im_/http://kyodaimahjongg.weebly.com/uploads/9/5/2/9/9529146/7310933_orig.jpg'
	},
	{
		name: 'Valentine\'s Day',
		author: 'My Kyodai Mahjongg',
		source: 'https://web.archive.org/web/20170903191728im_/http://kyodaimahjongg.weebly.com/uploads/9/5/2/9/9529146/1140822_orig.jpg'
	},
	{
		name: 'Christmas',
		author: 'My Kyodai Mahjongg',
		source: 'https://web.archive.org/web/20170903191728im_/http://kyodaimahjongg.weebly.com/uploads/9/5/2/9/9529146/1525811_orig.jpg'
	},
	{
		name: 'Canada Flower & Birds',
		author: 'My Kyodai Mahjongg',
		source: 'https://web.archive.org/web/20170903191743im_/http://kyodaimahjongg.weebly.com/uploads/9/5/2/9/9529146/2953105_orig.jpg'
	},
	{
		name: 'Canada Scenery',
		author: 'My Kyodai Mahjongg',
		source: 'https://web.archive.org/web/20170903191743im_/http://kyodaimahjongg.weebly.com/uploads/9/5/2/9/9529146/8401335_orig.jpg'
	},
	{
		name: 'Nova Scotia',
		author: 'My Kyodai Mahjongg',
		source: 'https://web.archive.org/web/20170903191743im_/http://kyodaimahjongg.weebly.com/uploads/9/5/2/9/9529146/2933195_orig.jpg'
	},
	{
		name: 'Canada Birds',
		author: 'My Kyodai Mahjongg',
		source: 'https://web.archive.org/web/20170903191743im_/http://kyodaimahjongg.weebly.com/uploads/9/5/2/9/9529146/9756515_orig.jpg'
	},
	{
		name: 'Arabic Alphabet & Numbers',
		author: 'My Kyodai Mahjongg',
		source: 'https://web.archive.org/web/20170902065732im_/http://kyodaimahjongg.weebly.com/uploads/9/5/2/9/9529146/5652995_orig.jpg'
	},
	{
		name: 'Mahjongg Platinum 2 Dark',
		author: 'Pavel Osharin',
		source: 'https://web.archive.org/web/20170903191723im_/http://kyodaimahjongg.weebly.com/uploads/9/5/2/9/9529146/2479283_orig.jpg'
	},
	{
		name: 'Mahjongg Platinum 2 Red',
		author: 'Pavel Osharin',
		source: 'https://web.archive.org/web/20170903191723im_/http://kyodaimahjongg.weebly.com/uploads/9/5/2/9/9529146/2090721_orig.jpg'
	},
	{
		name: 'Mahjongg Titans',
		author: 'Microsoft Vista',
		source: 'https://web.archive.org/web/20170903191723im_/http://kyodaimahjongg.weebly.com/uploads/9/5/2/9/9529146/6604294_orig.jpg'
	},
	{
		name: 'Viking Artifacts 1',
		author: 'vikinganswerlady',
		source: 'https://web.archive.org/web/20030919052725/http://www.vikinganswerlady.com/kyodai/VikingArtifacts.jpg'
	},
	{
		name: 'Viking Artifacts 2',
		author: 'vikinganswerlady',
		source: 'https://web.archive.org/web/20030919052725/http://www.vikinganswerlady.com/kyodai/VikingArtifacts2.jpg'
	},
	{
		name: 'Art of the Scythians',
		author: 'vikinganswerlady',
		source: 'https://web.archive.org/web/20030919052725/http://www.vikinganswerlady.com/kyodai/ScythianArt.jpg'
	},
	{
		name: 'Waite-Rider Tarot',
		author: 'vikinganswerlady',
		source: 'https://web.archive.org/web/20030919052725/http://www.vikinganswerlady.com/kyodai/WaiteRiderTarot.jpg'
	},
	{
		name: 'Waite-Rider Tarot Images',
		author: 'vikinganswerlady',
		source: 'https://web.archive.org/web/20030919052725im_/http://www.vikinganswerlady.com/kyodai/WaiteRiderTarotImagesThumbnail.jpg'
	},
	{
		name: 'Morgan-Greer Tarot',
		author: 'vikinganswerlady',
		source: 'https://web.archive.org/web/20030919052725/http://www.vikinganswerlady.com/kyodai/MorganGreerTarot.jpg'
	},
	{
		name: 'Xena: Tarot of the Bitter Suite',
		author: 'vikinganswerlady',
		source: 'https://web.archive.org/web/20030919052725/http://www.vikinganswerlady.com/kyodai/BitterSuite.jpg'
	},
	{
		name: 'A Rainbow of Bearded Irises',
		author: 'vikinganswerlady',
		source: 'https://web.archive.org/web/20030919052725/http://www.vikinganswerlady.com/kyodai/RainbowIris.jpg'
	},
	{
		name: 'Antique Roses',
		author: 'vikinganswerlady',
		source: 'https://web.archive.org/web/20030919052725/http://www.vikinganswerlady.com/kyodai/AntiqueRoses.jpg'
	},
	{
		name: 'Flags of the World',
		author: 'vikinganswerlady',
		source: 'https://web.archive.org/web/20030919052725im_/http://www.vikinganswerlady.com/kyodai/FlagsThumbnail.jpg'
	},
	{
		name: 'X-Men',
		author: 'vikinganswerlady',
		source: 'https://web.archive.org/web/20030919052725/http://www.vikinganswerlady.com/kyodai/XMen.jpg'
	},
	{
		name: 'Age of Empires II: Age of Kings',
		author: 'vikinganswerlady',
		source: 'https://web.archive.org/web/20030919052725/http://www.vikinganswerlady.com/kyodai/AOEII.jpg'
	}
];

async function loadImage(tileSetUrl: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const newImg = new Image();
		newImg.onload = () => {
			resolve(newImg);
		};
		newImg.onerror = () => {
			reject(`Image ${tileSetUrl} could not be loaded.`);
		};
		newImg.src = tileSetUrl;
	});
}

function hashCode(str: string) {
	let hash = 0;
	for (let i = 0, len = str.length; i < len; i++) {
		const chr = str.charCodeAt(i);
		hash = (hash << 5) - hash + chr;
		hash |= 0; // Convert to 32bit integer
	}
	return hash;
}

const kyodai = [
	['t_do1', 't_do2', 't_do3', 't_do4', 't_do5', 't_do6', 't_do7', 't_do8', 't_do9'],
	['t_ba1', 't_ba2', 't_ba3', 't_ba4', 't_ba5', 't_ba6', 't_ba7', 't_ba8', 't_ba9'],
	['t_ch1', 't_ch2', 't_ch3', 't_ch4', 't_ch5', 't_ch6', 't_ch7', 't_ch8', 't_ch9'],
	['t_se_winter', 't_se_spring', 't_se_summer', 't_se_fall', 't_wi_north', 't_wi_south', 't_wi_east', 't_wi_west'],
	['t_fl_bamboo', 't_fl_plum', 't_fl_orchid', 't_fl_chrysanthemum', 't_dr_green', 't_dr_white', 't_dr_red']
];

export async function buildKyodaiSVG(tileSetUrl?: string): Promise<string> {
	if (!tileSetUrl) {
		return '<svg><defs></defs></svg>';
	}
	const image = await loadImage(tileSetUrl);
	const rowHeight = image.height / 5;
	const colWidth = image.width / 9;
	const image_id = hashCode(tileSetUrl);
	let data = `<svg><defs><image id="${image_id}" xlink:href="${tileSetUrl}" x="0" y="0" height="${image.height}" width="${image.width}"/>`;
	kyodai.forEach(((row, nr) => {
		const y = nr * rowHeight;
		row.forEach((id, col) => {
			const x = col * colWidth;
			data += `<svg preserveAspectRatio="xMidYMid slice" id="${id}" width="75" height="100" viewBox="${x} ${y} ${colWidth} ${rowHeight}"><use xlink:href="#${image_id}"></use></svg>`;
		});
	}));
	data += '</defs></svg>';
	return data;
}
