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
            }
        }
        ,
        watch: {
            copy: {
                files: ['<%= conf.override %>/**'],
                tasks: ['copy']
            }
        }
    })
    ;

    // Next one would load plugins
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-watch');

    // Here is where we would define our task
    grunt.registerTask('build', ['copy']);
};