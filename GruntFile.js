/*
 *  Grunt file for overide projects with projects !
 *  Useful for develop and override projects without touching sources
 *  Eg, need to modify a legacy project which not provides modules or extensions
 *
 */

module.exports = function (grunt) {

    // Grunt configuration goes into initConfig
    grunt.initConfig({
        conf: grunt.file.readJSON('conf.json'),
        copy: {
            main: {
                cwd: '<%= conf.override %>',
                src: ['**'],
                dest: '<%= conf.project %>',
                expand: true
            },
            dev: {
                cwd: '<%= conf.override %>/dist-dev',
                src: ['**'],
                dest: '<%= conf.override %>/dist',
                expand: true
            }
        },
        run: {
            dev_server_osjs: {
                options: {
                    cwd: './osjs/bin'
                },
                cmd: 'win-start-dev.cmd'
            }
        },
        subgrunt: {
            grunt_watch_osjs: {
                options: {
                    npmInstall: false
                },
                projects: {
                    'osjs': 'watch'
                }
            }
        },
        watch: {
            copy: {
                files: ['<%= conf.override %>/**'],
                tasks: ['copy:main', 'copy:dev'],
                options: {
                    spawn: false
                }
            }
        },
        concurrent: {
            osjs_dev: {
                tasks: ['watch', 'run:dev_server_osjs', 'subgrunt:grunt_watch_osjs'],
                options: {
                    logConcurrentOutput: true
                }
            }
        }
    });

    // Next one would load plugins
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-concurrent');
    grunt.loadNpmTasks('grunt-subgrunt');
    grunt.loadNpmTasks('grunt-run');

    // Here is where we would define our task
    grunt.registerTask('build', ['copy']);
    grunt.registerTask('dev', ['concurrent:osjs_dev']);
};
