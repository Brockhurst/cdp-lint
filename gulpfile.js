const eslint = require('gulp-eslint');
var gulp = require('gulp');
var path = require('path');
var bower = require('gulp-bower');
var less = require('gulp-less');
var del = require('del');
var util = require('gulp-util');
var cached = require('gulp-cached');
var remember = require('gulp-remember');
var autoprefixer = require('gulp-autoprefixer');
var csso = require('gulp-csso');
var concat = require('gulp-concat');
var gulpif = require('gulp-if');
var imagemin = require('gulp-imagemin');
var spritesmith = require('gulp.spritesmith');
var htmlreplace = require('gulp-html-replace');
var uglify = require('gulp-uglify');
var mainBowerFiles = require('main-bower-files');
var filter = require('gulp-filter');
var webpack = require("webpack");
var BowerWebpackPlugin = require("bower-webpack-plugin");
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var WebpackDevServer = require('webpack-dev-server');

var argv = require('minimist')(process.argv.slice(2), {
    string: 'env',
    default: {env: process.env.NODE_ENV || 'development'}
});

var COMPILER;

var conf = {
    less: 'src/less/*.less',
    js: 'src/js/**/*.js',
    images: ['src/images/**/*.{png,svg}', '!src/images/icons/**'],
    icons: 'src/images/icons/*.png',
    html: 'src/*.html',
    sprite: {
        imgName: 'images/build/sprite.png',
        cssName: 'less/build/sprite.less',
        imgPath: '../../images/build/sprite.png'
    },
    build: {
        tmpFolders: '**/build',
        folder: 'build/',
        css: 'build/css',
        images: 'build/images',
        js: 'build/js',
        html: 'build/html'
    }
};

var webpackConfig = {
    entry: ["./src/js/main.js"],
    output: {
        path: path.resolve("/"),
        filename: "main.js",
        sourceMapFilename: '[file].map',
        publicPath: "/build/"
    },
    devtool: 'source-map',
    module: {
        loaders: [
            {
                test: /\.js$/,
                loader: "babel-loader",
                exclude: /node_modules/,
                query: {
                    presets: ['es2015']
                }
            },
            {
                test: /\.less$/,
                loader: ExtractTextPlugin.extract(
                    'css-loader?sourceMap!' +
                    'less-loader?sourceMap'
                )
            },
            {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract(
                    'css-loader?sourceMap'
                )
            },
            { test: /\.png$/, loader: 'file-loader' },
            { test: /\.eot$/, loader: 'file-loader' },
            { test: /\.woff2$/, loader: 'file-loader' },
            { test: /\.woff$/, loader: 'file-loader' },
            { test: /\.ttf$/, loader: 'file-loader' },
            { test: /\.svg$/, loader: 'file-loader' }
        ]
    },
    resolve: {
        modulesDirectories: ["node_modules", "bower_components"]
    },
    plugins: [
        new BowerWebpackPlugin(),
        new webpack.ProvidePlugin({
            $: "jquery",
            'jQuery': 'jquery',
            'jquery': 'jquery'
        }),
        new ExtractTextPlugin('styles.css', {
            allChunks: true
        })
    ]
};

var bootstrap = {
    less: 'bower_components/bootstrap/less/bootstrap.less'
};

gulp.task('bower', function () {
    return bower()
        .pipe(gulp.dest('bower_components'));
});

gulp.task('style-watch', function () {
    return gulp.src([bootstrap.less, conf.less])
        .pipe(cached())
        .pipe(less())
        .on('error', errorHandler)
        .pipe(autoprefixer(['last 2 version']))
        .pipe(remember())
        .pipe(concat('cdp.css'))
        .pipe(gulp.dest(conf.build.css))
});

gulp.task('images', ['clean', 'bower', 'sprite'], function () {
    return gulp.src(conf.images)
        .pipe(gulpif(argv.env === 'production', imagemin()))
        .pipe(gulp.dest(conf.build.images))
});

gulp.task('sprite', ['clean'], function () {
    return gulp.src(conf.icons)
        .pipe(spritesmith(conf.sprite))
        .pipe(gulp.dest('src/'));
});

gulp.task('lint:styles', function lintCssTask() {
    const gulpStylelint = require('gulp-stylelint');

    return gulp
        .src(conf.less)
        .pipe(gulpStylelint({
            reporters: [
                {formatter: 'string', console: true}
            ]
        }));
});

gulp.task('lint:scripts', () => {
    return gulp.src(conf.js)
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('html', ['clean'], function () {
    return gulp.src(conf.html)
        .pipe(htmlreplace({
            'js': '../main.js',
            'logo': {
                src: '../images/logo_gray-blue_80px.svg',
                tpl: '<img src="%s" alt="Epam logo"/>'
            },
            'css': '../styles.css'
        }))
        .pipe(gulp.dest(conf.build.html));
});


gulp.task('bundle', ['clean', 'bower'], function () {
    if (argv.env === 'production') {
        configProd(webpackConfig);
    }

    COMPILER = webpack(webpackConfig, function(err, stats) {});
});

gulp.task('bundle:prod', ['clean', 'bower'], function () {
    configProd(webpackConfig);

    webpack(webpackConfig, function(err, stats) {});
});


gulp.task('clean', function () {
    return del([conf.build.folder, conf.build.tmpFolders]);
});

gulp.task('build', ['images', 'html', 'bundle']);

gulp.task('watch', ['build'], function () {
    var server = new WebpackDevServer(COMPILER, {
        contentBase: "./build",
        hot: true
    });

    server.listen(8080);
});

function errorHandler(error) {
    util.log(util.colors.red('Error'), error.message);

    this.end();
}

function configProd(config) {
    webpackConfig.plugins.push(new webpack.optimize.UglifyJsPlugin());
    webpackConfig.plugins.push(new webpack.optimize.DedupePlugin());

    Object.assign(config, {
        devtool: ''
    })
}
