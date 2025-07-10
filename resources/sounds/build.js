const destFolder = "../../src/assets/sounds/";
const sourceFolder = "./sounds_org/";

const path = require("node:path");
const ffmpeg = require("fluent-ffmpeg");

async function convertMP3(source, dest) {
	return new Promise((resolve, reject) => {
		console.log(`convert to mp3 ${source}`);
		ffmpeg(source)
		.format("mp3")
		.audioBitrate("128k")
		.audioChannels(2)
		.audioCodec("libmp3lame")
		.on("end", () => {
			resolve();
		})
		.on("error", err => {
			reject(err);
		})
		.save(dest);
	});
}

async function convertOgg(source, dest) {
	return new Promise((resolve, reject) => {
		console.log(`convert to ogg ${source}`);
		ffmpeg(source)
		.format("ogg")
		.audioBitrate("128k")
		.audioChannels(2)
		.on("end", () => {
			resolve();
		})
		.on("error", err => {
			reject(err);
		})
		.save(dest);
	});
}

async function convert(entry, destName) {
	const source = path.resolve(sourceFolder, entry);
	const dest = path.resolve(destFolder, path.basename(destName, path.extname(destName)));
	await convertMP3(source, `${dest}.mp3`);
	await convertOgg(source, `${dest}.ogg`);
}

const files = {
	"245764__unclesigmund__small-stones_4.822.wav": "invalid.wav",
	"click-high.mp3": "match.wav",
	"329678__manuts__sound-logo-trademark-12.wav": "over.wav",
	"click-low.mp3": "select.mp3"
};

async function run() {
	for (const key of Object.keys(files)) {
		await convert(key, files[key]);
	}
}

run().then(() => {
	console.log("done");
}).catch(e => {
	console.log(`an error happened: ${e.message}`);
});
