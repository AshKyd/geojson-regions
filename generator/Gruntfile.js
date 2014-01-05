module.exports = function(grunt) {
    grunt.initConfig({
        watch: {
            styles: {
                files: [
                    'styles/*.less'
                ],
                tasks: [
                    'less:dev'
                ]
            },
            scripts: {
                files: [
                    'scripts/*.js'
                ],
                tasks: [
                    'browserify:dev'
                ]
            }
        },
        browserify: {
            dev: {
                files: {
                    'dist/app.min.js': ['scripts/app.js'],
                },
                options: {
                    // transform: []
                    debug:true
                }
            },
            prod: {
                files: {
                    'scripts/app.min.js': ['scripts/app.js'],
                },
                options: {
                    // transform: []
                    debug:false
                }
            }
        },
        uglify: {
            options: {
                preserveComments: 'some'
            },
            prod: {
                options: {},
                files: [{
                    expand: true,
                    cwd: 'scripts/',
                    src: ['app.min.js'],
                    dest: 'dist/'
                }]
            }
        },
        less: {
            dev: {
                files: {
                    "dist/app.css": "styles/app.less"
                }
            },
            prod: {
                options: {
                    paths: ["assets/css"],
                    cleancss: true
                },
                files: {
                    "dist/app.css": "styles/app.less"
                }
            }
        }

    });

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-browserify');


    // set tasks
    grunt.registerTask('default', ['watch']);
    grunt.registerTask('build', ['less:prod', 'browserify:prod','uglify:prod']);



};

// TODO: FTP deploy?