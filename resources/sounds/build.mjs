import path from "node:path";
import ffmpeg from "fluent-ffmpeg";

const destinationFolder = "../../src/assets/sounds/";
const sourceFolder = "./sounds_org/";

async function convertMP3(source, destination) {
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
			.on("error", error => {
				reject(error);
			})
			.save(destination);
	});
}

async function convertOgg(source, destination) {
	return new Promise((resolve, reject) => {
		console.log(`convert to ogg ${source}`);
		ffmpeg(source)
			.format("ogg")
			.audioBitrate("128k")
			.audioChannels(2)
			.on("end", () => {
				resolve();
			})
			.on("error", error => {
				reject(error);
			})
			.save(destination);
	});
}

async function convert(entry, destinationName) {
	const source = path.resolve(sourceFolder, entry);
	const destination = path.resolve(destinationFolder, path.basename(destinationName, path.extname(destinationName)));
	await convertMP3(source, `${destination}.mp3`);
	await convertOgg(source, `${destination}.ogg`);
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
}).catch(error => {
	console.log(`an error happened: ${error.message}`);
});
