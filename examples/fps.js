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
    
    function fill(){
      tm.each( function( x, y ){
        tm.set( x, y, randomChar(), randomColor(), randomColor() );    
      });
    }
    
    function animate( time ){ 
      fill();
      window.requestAnimationFrame( animate ); 

      timer.tick( time );
      fpsText.nodeValue = timer.fps() + 'fps';
    }
    
    var fpsMessage = document.createElement( 'div' );
    var fpsText = document.createTextNode( '0' );
    fpsMessage.appendChild( fpsText );
    document.body.appendChild( fpsMessage );
    
    var timer = new Timer();
    
    animate( 0 );    
  });  
  
  function Timer(){
    this.elapsed = 0;
    this.last = null;
  }     

  Timer.prototype.tick = function( now ){
    this.elapsed = ( now - ( this.last || now ) ) / 1000;
    this.last = now;
  };

  Timer.prototype.fps = function () {
    return Math.round( 1 / this.elapsed );
  };    
})();
