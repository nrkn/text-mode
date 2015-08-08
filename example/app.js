(function(){
  'use strict';

  document.addEventListener( 'DOMContentLoaded', function(){
    var tm = new TextMode();
    
    var codes = [];
    var codePoints = [
      {
        name: 'ascii',
        start: 0x0020,
        end: 0x007E
      }
    ];
    
    codePoints.forEach( function( code ){
      var size = code.end - code.start;
      for( var i = 0; i < size; i++ ){
        codes.push( String.fromCharCode( code.start + i ) );
      }
    });

    function randomHex(){
      var h = '#';
      for( var i = 0; i < 6; i++ ){
        h += Math.floor( Math.random() * 16 ).toString( 16 );
      }
      return h;
    }
    
    var palette = [];
    for( var i = 0; i < 16; i++ ){
      palette[ i ] = randomHex();
    }
    
    for( var f = 0; f < palette.length; f++ ){
      for( var b = 0; b < palette.length; b++ ){
        tm.addColor( palette[ f ], palette[ b ] );
      }
    }
    
    function randomChar(){
      return codes[ Math.floor( Math.random() * codes.length ) ];
    }
    
    function randomColor(){
      return palette[ Math.floor( Math.random() * palette.length ) ];
    }    
    
    tm.each( function( x, y ){
      tm.set( x, y, randomChar(), randomColor(), randomColor() );    
    });
  });  
})();
