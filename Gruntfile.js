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
                files: ['src/js/*.js'],
                tasks: ['jshint', 'uglify:build']
            }
        },
        jshint: {
            build: ['src/js/sf-active-js.js']
        },
        concat: {
            options: {
                sourceMap: true
            },
            libs: {
                src: [ 
                       'vendor/jquery-migrate-1.2.1.js',
                       "vendor/history.adapter.jquery.js",
                       "vendor/history.js",
                       "vendor/encoder.js",
                       "vendor/mustache.js",
                       "vendor/URI.js",
                       "vendor/json2.js",
                       "vendor/qrcodejs/qrcode.js"
                    ],
                dest: '<%= options.temp %>/js/libs.js'
            }
        },
        browserify: {
            options: {
                browserifyOptions: {
                    debug: true
                }
            },
            build: {
                src: '<%= options.src %>/js/*.js',
                dest: '<%= options.temp %>/js/app.js'
            },
        },
        exorcise: {
            build: {
                files: {
                    '<%= options.temp %>/js/app.js.map':'<%= options.temp %>/js/app.js',
                }
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
                sourceMap: true
            },
            build: {
                options: {
                    sourceMapIn: '<%= options.temp %>/js/app.js.map',
                },
                files: {
                    '<%= options.dest %>/js/app.js': '<%= options.temp %>/js/app.js'
                }
            },
            libs: {
                options: {
                    sourceMapIn: '<%= options.temp %>/js/libs.js.map',
                },
                files: {
                    '<%= options.dest %>/js/libs.js': '<%= options.temp %>/js/libs.js'
                }
            }
        },
        cssmin: {
            build: {
                src: '<%= options.src %>/css/main.css',
                dest: '<%= options.dest %>/css/main.css'
            }
        },
        htmlmin: {
            build: {
                options: {
                    removeComments: true,
                    collapseWhitespace: true
                },
                files: {
                    '<%= options.dest %>/index.html': '<%= options.src %>/index.html',
                }
            }
        },
        copy: {
            build: {
                files: [
                    { 
                        expand: true,
                        cwd: '<%= options.src %>/',
                        src: ['vendor/*','images/*','css/src/*','*.php','ws/*'],
                        dest: '<%= options.dest %>/'
                    }
                ]
            },
        },
        compress: {
            options: {
                archive: 'js.tgz',
                mode: 'tgz',
                pretty: true
            },
            build: {
                files: [{
                    src: ['**/*'],
                    cwd: '<%= options.dest %>/',
                    expand: true,
                    dest: './'
                }]
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
                cwd: '/home/johnk/Sites/la.indymedia.org/public/sf-active-js/',
                src: 'js.tgz', // file to uplload
                dest: '', // destination directory relative to home root
            }
        },
        'http-server': {
            dev: {
                root: '<%= options.dest %>/',
                host: 'indymedia.lo',
                showDir: true,
                autoIndex: true,
                ext: "html",
                proxy: "http://indymedia.lo",
            }
        }
    });
    grunt.registerTask('default', ['concat','browserify','exorcise','uglify','cssmin','htmlmin','copy']);
    grunt.registerTask('release', ['default','compress','scp']);
    grunt.registerTask('serve', ['default','http-server:dev']);
};
