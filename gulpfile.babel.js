import { src, dest, watch, series, parallel } from "gulp";
import browserSync from "browser-sync";
import pngquant from "imagemin-pngquant";
import mozjpeg from "imagemin-mozjpeg";
import del from "del";
import Sass from "gulp-sass";
const Ejs = require("gulp-ejs");
const babel = require("gulp-babel");
const uglify = require("gulp-uglify");
const cached = require("gulp-cached");
const plumber = require("gulp-plumber");
const postcss = require("gulp-postcss");
const imagemin = require("gulp-imagemin");
const changed = require("gulp-changed");
const rename = require("gulp-rename");
const autoprefixer = require("autoprefixer");

const destDir = "./dest";

export const ejs = () => {
  return src(["src/ejs/**/*.ejs", "!src/ejs/**/_*.ejs"])
    .pipe(cached("html"))
    .pipe(Ejs())
    .pipe(
      plumber({
        handleError: function (err) {
          console.log(err);
          this.emit("end");
        },
      })
    )
    .pipe(
      rename({
        extname: ".html",
      })
    )
    .pipe(dest(destDir + "/"));
};

var cleanCSS = require("gulp-clean-css");

export const sass = () => {
  return src(["src/scss/**/*.scss", "!src/scss/**/_*.scss"])
    .pipe(cached("sass"))
    .pipe(
      plumber({
        handleError: function (err) {
          console.log(err);
          this.emit("end");
        },
      })
    )
    .pipe(Sass())
    .pipe(postcss([autoprefixer()]))
    .pipe(
      rename({
        suffix: ".min",
        extname: ".css",
      })
    )
    .pipe(cleanCSS())
    .pipe(dest(destDir + "/css"));
};

////////////////////////////////////////////////////////////////////////////////////////////////////////

// js
export const js = () => {
  return src(["src/js/**/*.js", "!src/js/**/_*.js"])
    .pipe(cached("js"))
    .pipe(
      plumber({
        handleError: function (err) {
          console.log(err);
          this.emit("end");
        },
      })
    )
    .pipe(
      babel({
        presets: ["@babel/preset-env"],
      })
    )
    .pipe(
      rename({
        suffix: ".min",
      })
    )
    .pipe(uglify())
    .pipe(dest(destDir + "/js"));
};

/////////////////////////////////////////////////////////

// image
export const image = () => {
  return src(["src/img/**/*.{png,jpg,gif,svg}"])
    .pipe(changed("images"))
    .pipe(
      plumber({
        handleError: function (err) {
          console.log(err);
          this.emit("end");
        },
      })
    )
    .pipe(
      imagemin([
        pngquant({
          quality: "65-70",
          speed: 1,
          floyd: 0,
        }),
        mozjpeg({
          quality: 70,
          progressive: true,
        }),
        imagemin.svgo(),
        imagemin.gifsicle(),
      ])
    )
    .pipe(dest(destDir + "/img"));
};

////////////////////////////////////////////////////////////////////////////////////////////////////////

// movie
export const movie = () => {
  return src(["src/mov/**/*"])
    .pipe(
      plumber({
        handleError: function (err) {
          console.log(err);
          this.emit("end");
        },
      })
    )
    .pipe(dest(destDir + "/mov"));
};

////////////////////////////////////////////////////////////////////////////////////////////////////////

// font
export const font = () => {
  return src(["src/font/**/*"])
    .pipe(
      plumber({
        handleError: function (err) {
          console.log(err);
          this.emit("end");
        },
      })
    )
    .pipe(dest(destDir + "/font"));
};

export const copy = () => {
  return src(["src/**/*", "!src/{ejs,font,img,js,scss}", "!src/{ejs,font,img,js,scss}/**/*"]).pipe(
    dest("dist")
  );
};

const server = browserSync.create();
export const serve = (done) => {
  server.init({
    server: {
      baseDir: destDir,
      index: "index.html",
    },
    port: 3000,
  });
  done();
};
export const reload = (done) => {
  server.reload();
  done();
};

export const watchForChanges = () => {
  watch(["src/ejs/**/*.ejs", "!src/ejs/**/_*.ejs"], series(ejs, reload));
  watch("src/font/**/*", series(font, reload));
  watch("src/img/**/*.{jpg,jpeg,png,svg,gif}", series(image, reload));
  watch("src/js/**/*.js", series(js, reload));
  watch("src/scss/**/*.scss", series(sass, reload));
  watch(
    ["src/**/*", "!src/{ejs,font,img,js,scss}", "!src/{ejs,font,img,js,scss}/**/*"],
    series(copy, reload)
  );
  watch("**/*.php", reload);
};

export const clean = () => del(destDir);

export const dev = series(
  clean,
  parallel(ejs, font, image, js, sass, copy),
  serve,
  watchForChanges
);

export const build = series(clean, parallel(ejs, font, image, js, sass, copy));
export default dev;
