const destFolder = "../../src/assets/sounds/";
const sourceFolder = "./sounds_org/";

const path = require("path");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");

async function convertMP3(source, dest) {
  return new Promise((resolve, reject) => {
    console.log("convert to mp3 " + source);
    ffmpeg(source)
    .format("mp3")
    .audioBitrate("128k")
    .audioChannels(2)
    .audioCodec("libmp3lame")
    .on("end", () => {
      resolve();
    })
    .on("error", (err) => {
      reject(err);
    })
    .save(dest);
  });
}

async function convertOgg(source, dest) {
  return new Promise((resolve, reject) => {
    console.log("convert to ogg " + source);
    ffmpeg(source)
    .format("ogg")
    .audioBitrate("128k")
    .audioChannels(2)
    .on("end", () => {
      resolve();
    })
    .on("error", (err) => {
      reject(err);
    })
    .save(dest);
  });
}

async function convert(entry) {
  const source = path.resolve(sourceFolder, entry);
  const dest = path.resolve(destFolder, path.basename(entry, path.extname(entry)));
  await convertMP3(source, dest + ".mp3");
  await convertOgg(source, dest + ".ogg");
}

async function run() {
  const list = fs.readdirSync(sourceFolder).filter(entry => {
    return (path.extname(entry) === ".wav");
  });
  for (const entry of list) {
    await convert(entry);
  }
}

run().then(() => {
  console.log("done");
}).catch(e => {
  console.log("an error happened: " + e.message);
});
