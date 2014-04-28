'use strict';

var fs = require('fs');
var path = require('path');
var umi = require('umi2');
var transport = umi.transport;
var EventProxy = require('eventproxy');
var gulp = require('gulp');
var gulpif = require('gulp-if');
var less = require('gulp-less');
var coffee = require('gulp-coffee');
var uglify = require('gulp-uglify');
var cssmin = require('gulp-cssmin');
var flatten = require('gulp-flatten');
var header = require('gulp-header');
var footer = require('gulp-footer');
var wrapper = require('gulp-wrapper');
var es = require('event-stream');

module.exports = function buildFile(file, options, cb) {
  var isCSSFile = /\.(css|less)$/.test(file);
  var isJSFile = /\.(js|coffee)$/.test(file);
  var isHTMLFile = /\.html$/.test(file);

  if (isCSSFile) {
    buildCSS.apply(this, arguments);
  } else if (isHTMLFile) {
    buildHTML.apply(this, arguments);
  } else {
    buildJS.apply(this, arguments);
  }
};

function buildHTML(file, options, cb) {
  var ep = new EventProxy();
  ep.on('file', cb);

  var opt = umi.util.extendOption(options);
  var destFile;
  gulp.src(file, opt)
    .pipe(flatten())
    .pipe(gulp.dest(opt.dest))
    .pipe(es.map(function(file, cb) {
      destFile = path.relative(process.cwd(), file.path);
      cb(null, file);
    }))
    .on('end', function() {
      ep.emit('file', destFile);
    });
}

function buildCSS(file, options, cb) {
  var ep = new EventProxy();
  ep.on('file', cb);

  var opt = umi.util.extendOption(options);
  var destFile;
  gulp.src(file, opt)
    .pipe(gulpif(/\.less$/, less()))
    .pipe(gulpif(/\.css$/, transport.cssParser(opt)))
    .pipe(flatten())
    .pipe(gulp.dest(opt.dest))
    .pipe(es.map(function(file, cb) {
      destFile = path.relative(process.cwd(), file.path);
      cb(null, file);
    }))
    .on('end', function() {
      ep.emit('file', destFile);
    });
}

function buildJS(file, options, cb) {
  var ep = new EventProxy();
  ep.on('file', cb);

  var headerPath = path.join(__dirname, './header.tpl');
  var headerContent = fs.readFileSync(headerPath);

  var opt = umi.util.extendOption(options);
  var pkg = opt.pkg;
  var destFile;
  umi.src(file, opt)
    .pipe(gulpif(/\.less$/, less()))
    .pipe(gulpif(/\.css$/, transport.cssParser(opt))) // 这里不替换 debug
    .pipe(gulpif(/\.css$/, transport.css2jsParser(opt)))
    .pipe(gulpif(/\.tpl$/, transport.tplParser(opt)))
    .pipe(gulpif(/\.json$/, transport.jsonParser(opt)))
    .pipe(gulpif(/\.handlebars$/, transport.handlebarsParser(opt)))
    .pipe(gulpif(/\.js$/, transport(opt)))
    .pipe(umi.concat())
    .pipe(wrapper({
      header: '/*;(function() {*/\n'+headerContent+'\n',
      footer: '\nseajs.use("'+pkg.name+'/'+pkg.version+'/'+file+'");\n/*});*/\n'
    }))
    .pipe(flatten())
    .pipe(gulp.dest(opt.dest))
    .pipe(es.map(function(file, cb) {
      destFile = path.relative(process.cwd(), file.path);
      cb(null, file);
    }))
    .on('end', function() {
      ep.emit('file', destFile);
    });
}