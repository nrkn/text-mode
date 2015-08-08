module.exports = function( grunt ){
  grunt.initConfig({
    browserify: {
      dist: {
        files: {
          'dist/text-mode.js': 'src/browser.js'
        }
      }
    },
    uglify: {
      app: {
        src: 'dist/text-mode.js',
        dest: 'dist/text-mode-min.js'
      }
    }
  });

  grunt.loadNpmTasks( 'grunt-browserify' );
  grunt.loadNpmTasks( 'grunt-contrib-uglify' );

  grunt.registerTask( 'default', [ 'browserify', 'uglify' ] );  
};