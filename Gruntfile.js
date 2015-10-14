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
                src: [ 
                       'vendor/jquery-migrate-1.2.1.js',
                       "vendor/history.adapter.jquery.js",
                       "vendor/history.js",
                       "js/vendor/encoder.js",
                       "vendor/mustache.js",
                       "vendor/URI.js",
                       "vendor/json2.js",
                       "vendor/qrcodejs/qrcode.js"
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
        cssmin: {
            build: {
                src: 'src/main.css',
                dest: 'js/css/main.css'
            }
        },
        compress: {
            options: {
                archive: 'js.zip',
                mode: 'zip',
                pretty: true
            },
            build: {
                src: ['js/**/*']
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.registerTask('default', ['concat','uglify','cssmin']);
    grunt.registerTask('release', ['concat','uglify','cssmin', 'compress']);
};
