module.exports = function(grunt) {
  grunt.initConfig({

    exec: {
      server: {
        port: 8014,
        base: '.'
      },
      jasmine: {
        command: 'node node_modules/requirejs/bin/r.js -o build.js',
        stdout: true
      },
      watch: {
        files: ['public/test/jasmine/spec/**/*.js', 'public/js/**/*.js', 'public/test/jasmine/SpecRunner.js'],
        tasks: 'exec:jasmine'
      },

    }

  });

  grunt.loadNpmTasks('grunt-exec');

  grunt.registerTask('default', [
    'exec:server',
    'exec:jasmine',
    'exec:watch'
  ]);

};

