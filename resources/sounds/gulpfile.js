const gulp = require("gulp");
const ffmpeg = require("gulp-fluent-ffmpeg");

let dest = "../../src/assets";

gulp.task("sounds:all", ["sounds:mp3", "sounds:ogg", "sounds:legal"]);

gulp.task("sounds:mp3", () => {
	return gulp.src("./sounds_org/*.wav")
	.pipe(ffmpeg("mp3", (cmd) => {
		return cmd
		.audioBitrate("128k")
		.audioChannels(2)
		.audioCodec("libmp3lame")
	}))
	.pipe(gulp.dest(dest + "/sounds"));
});

gulp.task("sounds:ogg", () => {
	return gulp.src("./sounds_org/*.wav")
	.pipe(ffmpeg("ogg", (cmd) => {
		return cmd
		.audioBitrate("128k")
		.audioChannels(2);
	}))
	.pipe(gulp.dest(dest + "/sounds"));
});

gulp.task("sounds:legal", () => {
	return gulp.src("./sounds_org/LICENSE")
	.pipe(gulp.dest(dest + "/sounds"));
});
