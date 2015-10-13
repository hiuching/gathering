module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    exec: {
      build: {
        command: 'node node_modules/requirejs/bin/r.js -o build.js'
      }
    }
  });

  grunt.registerTask('copy-require', function() {
    grunt.file.copy('node_modules/requirejs/require.js', 'public/libs/requirejs/require.js');
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-exec');

  // Default task(s).
  grunt.registerTask('default', ['exec', 'copy-require']);

};