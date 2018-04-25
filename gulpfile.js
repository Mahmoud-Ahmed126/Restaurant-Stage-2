// https://github.com/CodeChron/browsersync-gulp-4-express/blob/master/gulpfile.js

var gulp = require('gulp')
var sass = require('gulp-sass')
var rename = require('gulp-rename')
var autoprefixer = require('gulp-autoprefixer')
var browserSync = require('browser-sync').create()
var cleanDest = require('gulp-clean-dest')
var responsive = require('gulp-responsive')
const webp = require('gulp-webp');
var concat = require('gulp-concat')
var sourcemaps = require('gulp-sourcemaps') // maps to original files
var compressor = require('node-minify');
// var inlineCss = require('inline-css');



// dist is the distribution folder
var paths = {
	// copyFilesDist: {
	// 	src: './*.html',
	// 	dest: './dist/'
	// },
	styles: {
		src: './sass/**/*.scss',
		dest: './css'
	},
	// stylesDist: {
	// 	src: './sass/**/*.scss',
	// 	dest: './dist/css'
	// },
	images: {
		src: './img-raw/**/*.{jpg,png}',
		dest: './img'
	},
	imagesWebp: {
		src: './img-raw/**/*.{jpg,png}',
		dest: './img-raw'
	},
	scripts: {
		src: './js/**/*.js',
		dest: './js/'
	},
	scriptsDist: {
		src: './js/**/*.js',
		dest: './dist/js/'
	}
}

/*
 * Define tasks using plain functions
 */
function styles() {
	return gulp
		.src(paths.styles.src)
		.pipe(sass().on('error', sass.logError))
		.pipe(autoprefixer({
			browsers: ['last 2 versions']
		}))
		.pipe(sourcemaps.init({
			loadMaps: true
		})) // Strip inline source maps
		.pipe(sass({
			outputStyle: 'compressed'
		}))
		.pipe(concat('allStyles.css'))
		.pipe(sourcemaps.write())
		.pipe(cleanDest(paths.styles.dest))
		.pipe(gulp.dest(paths.styles.dest))
		.pipe(browserSync.stream())
}

function watch() {
	//watch the styles folder and execute styles func
	gulp.watch(paths.styles.src, styles).on('change', browserSync.reload)
	gulp.watch('./**/*.{html,js}').on('change', browserSync.reload)
	// gulp.watch('/index.html', copyFilesToDist).on('change', browserSync.reload)

}

function browserSyncInit() {
	browserSync.init({
		server: {
			baseDir: './'
			// baseDir: './dist/' // for production
		}
	})
}


// copy webp images to img folder
function copyWebpToImg() {
	return gulp
		.src('./img-raw/*.webp')
		.pipe(gulp.dest('./img'))
}



// MINIFY js script BUGGY babelify and uglify destroys the code...
// Usage: execute concatScripts then minifyScripts
// sourcemaps doubles the size so should not be used on production files
function minifyJS() {
	// Using Google Closure Compiler
	var mainMin = compressor.minify({
		compressor: 'gcc',
		input: 'js/main.js',
		output: 'js/main-min.js',
		callback: function (err, min) {}
	})
	var dbhelperMin = compressor.minify({
		compressor: 'gcc',
		input: 'js/dbhelper.js',
		output: 'js/dbhelper-min.js',
		callback: function (err, min) {}
	})

	var restInfoMin = compressor.minify({
		compressor: 'gcc',
		input: 'js/restaurant_info.js',
		output: 'js/restaurant_info-min.js',
		callback: function (err, min) {}
	})

	var swMin = compressor.minify({
		compressor: 'gcc',
		input: 'sw.js',
		output: 'sw-min.js',
		callback: function (err, min) {}
	})

	return mainMin, dbhelperMin, restInfoMin, swMin
}

// MAKE IMAGES RESPONSIVE
function responsiveImages() {
	return gulp
		.src(paths.images.src)
		.pipe(responsive({
			// Resize jpg in various sizes
			'*.jpg': [{
				width: 64,
				rename: {
					suffix: '-64w'
				}
			},
			{
				width: 128,
				rename: {
					suffix: '-128w'
				}
			},
			{
				width: 400,
				rename: {
					suffix: '-400w'
				}
			},
			{
				width: 500,
				rename: {
					suffix: '-500w'
				}
			},
			{ // rename original img
				rename: {
					suffix: ''
				}
			}
			],
			// Resize all PNG images (currently the logo) to be retina ready    
			'*.png': [{
				width: 48,
				height: 48,
				rename: {
					suffix: '-48x48'
				},
			},
			{
				width: 96,
				height: 96,
				rename: {
					suffix: '-96x96'
				},
			},
			{
				width: 144,
				height: 144,
				rename: {
					suffix: '-144x144'
				},
			},
			{
				width: 192,
				height: 192,
				rename: {
					suffix: '-192x192'
				},
			},
			{
				width: 512,
				height: 512,
				rename: {
					suffix: '-512x512'
				},
			},
			{
				width: 250 * 2,
				rename: {
					suffix: '-250x250@2x'
				},
			}
			],
		}, {
			// Global configuration for all images
			// The output quality for JPEG, WebP and TIFF output formats
			quality: 70,
			// Use progressive (interlace) scan for JPEG and PNG output
			progressive: true,
			// Strip all metadata
			withMetadata: false
		}))
		.pipe(cleanDest(paths.images.dest))
		.pipe(gulp.dest(paths.images.dest))
}


function convertToWebp() {
	return gulp
		.src(paths.imagesWebp.src)
		.pipe(webp())
		// into src folder, aka img-raw, 
		// because is the src folder for responsiveImages()
		.pipe(gulp.dest(paths.imagesWebp.dest))
}

// concat already minimized js files
function concatJS() {
	// index.html js 
	var indexJS = gulp.src(['./js/dbhelper-min.js', './js/main-min.js'])
		.pipe(concat('allMain.min.js'))
		.pipe(gulp.dest('./js'));

	// restaurant.html js 
	var restaurantJS = gulp.src(['./js/dbhelper-min.js', './js/restaurant_info-min.js'])
		.pipe(concat('allRestaurant.min.js'))
		.pipe(gulp.dest('./js'));

	return indexJS, restaurantJS
}

// function inlineStyles() {
// 	var html = 'css/allStyles.css';
// 
// 	return inlineCss(html)
// }
// 


// Tasks
gulp.task('watch', styles)
gulp.task('minifyJS', minifyJS)
gulp.task('concatJS', concatJS)
// gulp.task('inlineStyles', inlineStyles)
gulp.task('responsive', responsiveImages)
// gulp.task('copyFilesToDist', copyFilesToDist) // copy index.html to dist folder
// gulp.task('concatScripts', concatScripts) // minify js


/*
 * Define default task that can be called by just running `gulp` from cli
 */
// gulp.task('default', styles, watch);
gulp.task('images', gulp.series(convertToWebp, copyWebpToImg, responsiveImages));
gulp.task('default', gulp.series(styles, gulp.parallel(watch, browserSyncInit)))
gulp.task('default2', gulp.series(styles, minifyJS, concatJS, gulp.parallel(watch, browserSyncInit)))
