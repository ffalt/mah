#!/bin/sh

convert()
{
ffmpeg -i "./$1" -vn -ac 2 -c:a libmp3lame -b:a 128k "../../src/assets/sounds/$2.mp3"
ffmpeg -i "./$1" -vn -ac 2 -c:a libvorbis -b:a 128k "../../src/assets/sounds/$2.ogg"
}

convert "245764__unclesigmund__small-stones_4.822.wav" "invalid"
convert "click-high.mp3" "match"
convert "329678__manuts__sound-logo-trademark-12.wav" "over"
convert "click-low.mp3" "select"
