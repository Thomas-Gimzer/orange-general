const gulp = require("gulp");
const sass = require("gulp-sass");
const browserSync = require("browser-sync").create();
let reload = browserSync.reload;
const autoprefix = require("gulp-autoprefixer");
const cleanCSS = require("gulp-clean-css");
const imagemin = require("gulp-imagemin");
const imageminGuetzli = require("imagemin-guetzli");
const babel = require("gulp-babel");
const uglify = require("gulp-uglify");
const gzip = require("gulp-gzip");
const gutil = require("gulp-util");
const ftp = require("vinyl-ftp");
const concat = require("gulp-concat");
const include = require("gulp-include");
const ftpConfig = require("./config.json");
const checkCSS = require("gulp-check-unused-css");

// FTP config
var user = ftpConfig.ftpUser; /*process.env.FTP_USER;*/
var password = ftpConfig.ftpPass; /*process.env.FTP_PWD;*/
var host = ftpConfig.ftpHost;
var port = ftpConfig.ftpPort;
var localFilesGlob = ["./dist/**/*"];
var remoteFolder = "/dev2/";

// Connect to FTP
function getFtpConnection() {
  return ftp.create({
    host,
    port,
    user,
    password,
    parallel: 5,
    log: gutil.log
  });
}

gulp.task("removeRemoteDirectory", function() {
  const conn = getFtpConnection();
  conn.rmdir(remoteFolder, function(error) {
    console.log(error);
  });
});

gulp.task("upload", function() {
  const conn = getFtpConnection();
  return (
    gulp
      .src(localFilesGlob)
      // .pipe(conn.newer(remoteFolder))
      .pipe(conn.dest(remoteFolder))
  );
});

gulp.task("upload-css", function() {
  const conn = getFtpConnection();
  return (
    gulp
      .src("dist/css/*")
      // .pipe(conn.newer(remoteFolder))
      .pipe(conn.dest(remoteFolder + "/css"))
  );
});

gulp.task("upload-js", function() {
  const conn = getFtpConnection();
  return (
    gulp
      .src("dist/js/*")
      // .pipe(conn.newer(remoteFolder))
      .pipe(conn.dest(remoteFolder + "/js"))
  );
});

gulp.task("sass", function() {
  return gulp
    .src("scss/**/*.scss")
    .pipe(sass())
    .on("error", sass.logError)
    .pipe(autoprefix({ grid: true }))
    .pipe(cleanCSS())
    .pipe(gulp.dest("css"))
    .pipe(gzip())
    .pipe(gulp.dest("css"))
    .pipe(
      browserSync.reload({
        stream: true
      })
    );
});

gulp.task("babel", ["concat", "extra-scripts"], function() {
  return gulp
    .src("js/*.js")
    .pipe(
      babel({
        presets: ["env"]
      })
    )
    .on("error", function(error) {
      console.log(error.toString());
      this.emit("end");
    })
    .pipe(uglify())
    .pipe(gulp.dest("js"))
    .pipe(gzip())
    .pipe(gulp.dest("js"))
    .pipe(
      browserSync.reload({
        stream: true
      })
    );
});

gulp.task("concat", function() {
  return gulp
    .src([
      "src/js/modernizr-grid.js",
      "src/js/siema.min.js",
      "src/js/awesomplete.js",
      "src/js/functions.js",
      "src/js/privacy.js",
      "src/js/main.js"
    ])
    .pipe(concat("bundle.js"))
    .pipe(gulp.dest("js"))
    .pipe(gzip())
    .pipe(gulp.dest("js"));
});

gulp.task("extra-scripts", function() {
  return gulp
    .src([
      "src/js/youtube.js",
      "src/js/twitter.js",
      "src/js/safari-font-fix.js",
      "src/js/filter.js",
      "src/js/oembed.js"
    ])
    .pipe(gulp.dest("js"))
    .pipe(gzip())
    .pipe(gulp.dest("js"));
});

gulp.task("watch", ["browserSync", "sass", "babel", "include"], function() {
  gulp.watch("scss/**/*.scss", ["sass"]);
  gulp.watch("src/js/*.js", ["babel"]);
  gulp.watch("src/html/*.html", ["include"]);
  // gulp.watch("*.php", reload);
});

gulp.task("browserSync", function() {
  browserSync.init({
    notify: false,
    server: {
      baseDir: "./"
    }
  });
});

gulp.task("imagemin", ["guetzli"], function() {
  gulp
    .src("assets/img/**/*.{gif,svg,mp4}")
    .pipe(imagemin())
    .on("error", function(error) {
      console.log(error.toString());
      this.emit("end");
    })
    .pipe(gulp.dest("dist/assets/img"));
});

gulp.task("guetzli", function() {
  gulp
    .src("assets/img/**/*.{jpg, png}")
    .pipe(imagemin([imageminGuetzli()]))
    .pipe(gulp.dest("dist/assets/img"));
});

gulp.task("package", function() {
  gulp.src("css/*.{css,gz}").pipe(gulp.dest("dist/css"));
  gulp.src("js/*").pipe(gulp.dest("dist/js"));
  // gulp.src("font").pipe(gulp.dest("dist/font"));
  gulp.src("*.{html,php}").pipe(gulp.dest("dist"));
  gulp.src("favicons/*").pipe(gulp.dest("dist/favicons"));
});

gulp.task("package-styling", function() {
  gulp.src("css/*.{css,gz}").pipe(gulp.dest("dist/css"));
  gulp
    .src([
      "js/bundle.js",
      "js/bundle.js.gz",
      "js/twitter.js",
      "js/twitter.js.gz",
      "js/safari-font-fix.js",
      "js/safari-font-fix.js.gz"
    ])
    .pipe(gulp.dest("dist/js"));
});

gulp.task("include", function() {
  gulp
    .src("src/html/*.html")
    .pipe(include())
    .on("error", function(error) {
      console.log(error.toString());
      this.emit("end");
    })
    .pipe(gulp.dest("./"))
    .pipe(
      browserSync.reload({
        stream: true
      })
    );
});

gulp.task("unusedCss", () => {
  return gulp
    .src(["./css/*.css", "./*.html"])
    .pipe(checkCSS({ ignore: ["awesomplete"] }));
});
