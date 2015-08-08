module.exports = function( grunt ){
  grunt.initConfig({
    browserify: {
      dist: {
        files: {
          'text-mode.js': 'src/browser.js'
        }
      }
    },
    uglify: {
      app: {
        src: 'text-mode.js',
        dest: 'text-mode-min.js'
      }
    }
  });

  grunt.loadNpmTasks( 'grunt-browserify' );
  grunt.loadNpmTasks( 'grunt-contrib-uglify' );

  grunt.registerTask( 'default', [ 'browserify', 'uglify' ] );  
};