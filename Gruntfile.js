module.exports = function(grunt) {
    require('load-grunt-tasks')(grunt);
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        options : {
            src: 'src',
            dest: 'build',
            temp: '.tmp'
        },
        
        watch: {
            scripts: {
                files: ['src/js/sf-active-js.js'],
                tasks: ['jshint', 'uglify:build']
            }
        },
        jshint: {
            build: ['src/js/sf-active-js.js']
        },

        concat: {
            libs: {
                src: [ 
                       'vendor/jquery-migrate-1.2.1.js',
                       "vendor/history.adapter.jquery.js",
                       "vendor/history.js",
                       "<%= options.src %>/js/vendor/encoder.js",
                       "vendor/mustache.js",
                       "vendor/URI.js",
                       "vendor/json2.js",
                       "vendor/qrcodejs/qrcode.js"
                    ],
                dest: '<%= options.temp %>/libs.js'
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: '<%= options.src %>/js/sf-active-js.js',
                dest: '<%= options.dest %>/js/sf-active-js.js'
            },
            libs: {
                src: '<%= options.temp %>/libs.js',
                dest: '<%= options.dest %>/js/libs.js'
            }
        },
        cssmin: {
            build: {
                src: '<%= options.src %>/css/main.css',
                dest: '<%= options.dest %>/css/main.css'
            }
        },
        copy: {
            build: {
                files: [
                    { 
                        expand: true,
                        cwd: '<%= options.src %>/',
                        src: ['index.html','vendor/*','images/*','css/src/*'],
                        dest: '<%= options.dest %>/'
                    }
                ]
            },
        },
        compress: {
            options: {
                archive: 'js.zip',
                mode: 'zip',
                pretty: true
            },
            build: {
                src: ['<%= options.dest %>/**/*', '<%= options.dest %>/**/**/*'],
                dest: './'
            }
        },
        scp: {
            options: {
                host: 'slaptech.net',
                port: 2222,
                username: 'johnk',
                privateKey: grunt.file.read('/home/johnk/.ssh/id_rsa'),
                path: '/home/johnk',
            },
            build: {
                cwd: '/home/johnk/Sites/la.indymedia.org/public/sf-active-js/<%= options.dest %>',
                src: 'js.zip', // file to uplload
                dest: '', // destination directory relative to home root
            }
        }
    });
    grunt.registerTask('default', ['concat','uglify','cssmin','copy']);
    grunt.registerTask('release', ['concat','uglify','cssmin','copy','compress','scp']);
};
