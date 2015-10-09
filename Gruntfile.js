module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        watch: {
            scripts: {
                files: ['src/sf-active-js.js'],
                tasks: ['jshint', 'uglify:build']
            }
        },
        jshint: {
            build: ['src/sf-active-js.js']
        },
        concat: {
            libs: {
                src: [ 'js/vendor/jquery-1.9.1.min.js',
                       'js/vendor/jquery-migrate-1.2.1.js',
                       "js/vendor/history.adapter.jquery.js",
                       "js/vendor/history.js",
                       "js/vendor/mustache.js",
                       "js/vendor/URI.js",
                       "js/vendor/json2.js",
                       "js/vendor/qrcodejs/qrcode.js"
                    ],
                dest: 'build/libs.js'
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: 'src/sf-active-js.js',
                dest: 'js/js/sf-active-js.js'
            },
            libs: {
                src: 'build/libs.js',
                dest: 'js/js/libs.js'
            }
        },
    });
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.registerTask('default', ['concat','uglify']);
};
