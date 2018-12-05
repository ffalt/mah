const destFolder = "../../src/assets/sounds/";
const sourceFolder = "./sounds_org/";

const path = require("path");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");

function convertMP3(source, dest, cb) {
  console.log("convert to mp3 " + source);
  ffmpeg(source)
  .format("mp3")
  .audioBitrate("128k")
  .audioChannels(2)
  .audioCodec("libmp3lame")
  .on("end", () => {
    cb();
  })
  .on("error", (err) => {
    cb(err);
  })
  .save(dest);
}

function convertOgg(source, dest, cb) {
  console.log("convert to ogg " + source);
  ffmpeg(source)
  .format("ogg")
  .audioBitrate("128k")
  .audioChannels(2)
  .on("end", () => {
    cb();
  })
  .on("error", (err) => {
    cb(err);
  })
  .save(dest);
}

function convert(entry, cb) {
  const source = path.resolve(sourceFolder, entry);
  const dest = path.resolve(destFolder, path.basename(entry, path.extname(entry)));
  convertMP3(source, dest + ".mp3", (e1) => {
    if (e1) {
      console.log("an error happened: " + e1.message);
    }
    convertOgg(source, dest + ".ogg", (e2) => {
      if (e2) {
        console.log("an error happened: " + e2.message);
      }
      cb();
    });
  });
}

const list = fs.readdirSync(sourceFolder).filter(entry => {
  return (path.extname(entry) === ".wav");
});

function run(index) {
  if (index >= list.length) {
    console.log("done");
  } else {
    convert(list[index], () => {
      run(index + 1);
    });
  }
}

run(0);
