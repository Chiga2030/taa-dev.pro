const path = {
	build: {
		html: './build/',
		style: 'build/',
		script: 'build/js/',
    img: 'build/img/',
    fonts: 'build/fonts/',
	},
	src: {
		html: {
			indexFile: 'source/html/index.html',
			watchFiles: 'source/html/*.html',
		},
		style: 'source/**/*.css',
		script: 'source/**/*.js',
    img: 'source/img/**/*',
    fonts: 'source/fonts/',
	}
};

const autoprefixer = require('gulp-autoprefixer');
const gulp = require('gulp');
const env = require('gulp-env');				//переменные окружения
const clean = require('gulp-clean');		//zero configuration tool
const babel = require('gulp-babel');		//для трансшпиляции
const concat = require('gulp-concat');	//для объединения файлов
const uglify = require('gulp-uglify');	//для минификации js-файлов
const gulpif = require('gulp-if');			//для минификации js-файлов
const cssnano = require('gulp-cssnano');	//для минификации css-файлов
const sourcemaps = require('gulp-sourcemaps');
const browserSync = require('browser-sync').create();
const fileinclude = require('gulp-file-include');	//для работы с html
const imagemin = require('gulp-imagemin');  // compress images
const ttf2woff = require('gulp-ttf2woff');
const ttf2woff2 = require('gulp-ttf2woff2');

env ({
	file: '.env',
	type: 'ini',
});

/* Сборка html из разных файлов */
gulp.task('build-html', () => {
  gulp.src(path.src.html.indexFile)
    .pipe(fileinclude())
    .pipe(gulp.dest(path.build.html));
});

/* сборка скриптов в один файл *-min.js */
gulp.task('build-scripts', () => {
	gulp.src(path.src.script)
    .pipe(gulpif(process.env.SOURCEMAPS === 'switch-on', sourcemaps.init()))
			.pipe(concat('scripts-min.js'))
    	.pipe(gulpif(process.env.BABEL === 'switch-on', babel({
	    	presets: ['@babel/env']
	    })))
    	.pipe(gulpif(process.env.NODE_ENV === 'production', uglify()))
    .pipe(gulpif(process.env.SOURCEMAPS === 'switch-on', sourcemaps.write()))
		.pipe(gulp.dest(path.build.script));
});

/* сборка стилей в один файл style-min.css */
gulp.task('build-styles', () => {
	gulp.src(path.src.style)
    .pipe(gulpif(process.env.SOURCEMAPS === 'switch-on', sourcemaps.init()))
			.pipe(concat('style-min.css'))
    	.pipe(gulpif(process.env.PRODUCTION === 'switch-on', cssnano()))
    .pipe(gulpif(process.env.SOURCEMAPS === 'switch-on', sourcemaps.write()))
		.pipe(gulp.dest(path.build.style));
});

/* zero configuration */
gulp.task('clean', () => {
	gulp.src('./build', {read: false})
  	.pipe(clean());
});

// compress images
gulp.task('build-images', () => {
  gulp.src(path.src.img)
    .pipe(imagemin())
    .pipe(gulp.dest(path.build.img));
});

/* сборка шрифтов */
gulp.task('build-fonts', () => {
  gulp.src(`${path.src.fonts}*.ttf`)
    .pipe(ttf2woff())
    .pipe(gulp.dest(path.src.fonts));
  return gulp.src(`${path.src.fonts}*.ttf`)
    .pipe(ttf2woff2())
    .pipe(gulp.dest(path.src.fonts));
});

gulp.task('copy-fonts', () => {
  gulp.src(`${path.src.fonts}*.*[^".css"]`)
    .pipe(gulp.dest(path.build.fonts));

  gulp.src(`${path.src.fonts}*.css`)
    .pipe(gulpif(process.env.SOURCEMAPS === 'switch-on', sourcemaps.init()))
    .pipe(autoprefixer({
      cascade: false,
    }))
    .pipe(concat('fonts.css'))
    .pipe(gulpif(process.env.PRODUCTION === 'switch-on', cssnano({
      minifyFontValues: false,
      discardUnused: false,
    })))
    .pipe(gulpif(process.env.SOURCEMAPS === 'switch-on', sourcemaps.write()))
    .pipe(gulp.dest(path.build.fonts));
});

gulp.task('default', ['build', 'browser-sync']);	//build for dev
gulp.task('build', ['build-html', 'build-styles', 'build-scripts', 'build-images', 'build-fonts', 'copy-fonts']);
gulp.task('prod', ['build']);	//build for prod

gulp.task('browser-sync', () => {
	browserSync.init({
    server: {
    	baseDir: "./build/"
    }
  });
	gulp.watch(path.src.html.watchFiles, ['watch-html']);
	gulp.watch(path.src.style, ['watch-styles']);
	gulp.watch(path.src.script, ['watch-scripts']);
  gulp.watch(path.src.img, ['watch-images',]);
  gulp.watch(path.src.fonts, ['watch-fonts',]);
});

gulp.task('watch-html', ['build-html'], () => browserSync.reload());
gulp.task('watch-styles', ['build-styles'], () => browserSync.reload());
gulp.task('watch-scripts', ['build-scripts'], () => browserSync.reload());
gulp.task('watch-images', ['build-images',], () => browserSync.reload());
gulp.task('watch-fonts', ['build-fonts', 'copy-fonts',], () => browserSync.reload());
