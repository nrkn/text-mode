'use strict';

var template = require( './string-inject' );
var charSize = require( './char-size' );

function TextMode( target, options ){
  if( !( this instanceof TextMode )){
    return new TextMode( target, options );
  }  
  
  var tm = this;

  var parent;
  if( typeof target === 'string' ){
    parent = document.querySelector( target );
  } else if( target instanceof HTMLElement ){
    parent = target;
  } else {
    parent = document.body;
    
    if( !options && target && Object.keys( target ).some( function( key ){
        return key in TextMode.defaults;
    })){
      options = target;
    };      
  };
  
  tm.viewport = document.createElement( 'div' );
  parent.appendChild( tm.viewport );

  options = options || TextMode.defaults;
  Object.keys( TextMode.defaults ).forEach( function( key ){
    tm[ key ] = key in options ? 
      options[ key ] : 
      TextMode.defaults[ key ];
  });

  tm.id = randomId();
  tm.viewport.id = 'tm-' + tm.id;

  tm.sheet = newSheet();
  tm.charSize = charSize( tm.font );

  tm.size = {
    width: tm.columns * tm.charSize.width,
    height: tm.rows * tm.charSize.height
  };

  cache[ tm.id ] = {
    tiles: [],
    textNodes: [],
    fore: [],
    back: [],
    className: [],
    classMap: {},
    nextIndex: 0
  };

  var viewportStyle = templates.viewport( tm );  
  var tilesStyle = templates.tiles( tm.charSize );

  newRule( tm.sheet, '#' + tm.viewport.id, viewportStyle );
  newRule( tm.sheet, '#' + tm.viewport.id + ' span', tilesStyle );

  initTiles( tm );
}

TextMode.prototype.set = function( column, row, text, fore, back, className ){
  var tm = this;
  
  if( Array.isArray( column ) ){
    var buffer = column;
    
    tm.each( function( x, y, i ){
      tm.set( x, y, buffer[ i ].text, buffer[ i ].fore, buffer[ i ].back, buffer[ i ].className );
    });
    
    return;
  }

  var i = row * tm.columns + column;

  cache[ tm.id ].textNodes[ i ].nodeValue = text;

  if( fore || back ){
    tm.setColor( column, row, fore, back );
  }
  
  if( className ){
    tm.setClassName( column, row, className );
  }
};

TextMode.prototype.setColor = function( column, row, fore, back ){
  var tm = this;

  var i = row * tm.columns + column;

  if( fore === cache[ tm.id ].fore[ i ] && back === cache[ tm.id ].back[ i ] ) return;
  
  fore = fore || cache[ tm.id ].fore[ i ] || tm.fore;
  back = back || cache[ tm.id ].back[ i ] || tm.back;

  tm.fore = cache[ tm.id ].fore[ i ] = fore;
  tm.back = cache[ tm.id ].back[ i ] = back;

  var key = fore + ',' + back;

  if( !( key in cache[ tm.id ].classMap ) ){
    tm.addColor( fore, back );
  }

  var colorClass = cache[ tm.id ].classMap[ key ];

  cache[ tm.id ].tiles[ i ].className = colorClass + ' ' + cache[ tm.id ].className[ i ];
};

TextMode.prototype.setClassName = function( column, row, className ){
  var tm = this;

  var i = row * tm.columns + column;
  
  if( cache[ tm.id ].className[ i ] === className ) return;

  cache[ tm.id ].className[ i ] = className;
  
  var colorClass = getColorClass( tm, i );
  
  cache[ tm.id ].tiles[ i ].className = colorClass + ' ' + className;
};

TextMode.prototype.get = function( column, row ){
  var tm = this;

  if( typeof column !== 'number' ){
    var buffer = [];
    
    tm.each( function( x, y, i ){
      buffer[ i ] = tm.get( x, y );
    });
    
    return buffer;
  }
  
  var i = row * tm.columns + column;

  return {
    fore: cache[ tm.id ].fore[ i ],
    back: cache[ tm.id ].back[ i ],
    text: cache[ tm.id ].textNodes[ i ].nodeValue,
    className: cache[ tm.id ].className[ i ]
  };
};

TextMode.prototype.addColor = function( fore, back ){
  var tm = this;

  var key = fore + ',' + back;
  
  if( key in cache[ tm.id ].classMap ) return;
  
  var className = 'color-' + tm.id + '-' + nextIndex( tm.id );

  cache[ tm.id ].classMap[ key ] = className;
  
  newRule( tm.sheet, '.' + className, templates.color({ fore: fore, back: back }));
};

TextMode.prototype.each = function( callback ){
  var tm = this;

  for( var i = 0; i < tm.columns * tm.rows; i++ ){
    var x = i % tm.columns;
    var y = Math.floor( i / tm.columns );

    callback( x, y, i );
  }
};

TextMode.defaults = {
  columns: 80,
  rows: 25,
  fore: '#ddd',
  back: '#222',
  font: '16px monospace'
};

var cache = {};

var templates = {
  style: template( '<%=selector%> { <%=rule%> }' ),
  color: template( 'background: <%=back%>; color: <%=fore%>;' ),
  viewport: template( 'position: relative; width: <%=size.width%>px; height: <%=size.height%>px; font: <%=font%>' ),
  tiles: template( 'position: absolute; line-height: <%=height%>px; width: <%=width%>px; height: <%=height%>px;' ),
  tile: template( 'top: <%=top%>px; left: <%=left%>px;' )
};

function newSheet(){
  var style = document.createElement( 'style' );

  document.head.appendChild( style );

  return style.sheet;
}

function newRule( sheet, selector, rule ){
  var style = templates.style({
    selector: selector,
    rule: rule
  });

  sheet.insertRule( style, sheet.cssRules.length );
}

function randomId( prefix ){
  var h = prefix || '';

  for( var i = 0; i < 8; i++ ){
    h += Math.floor( Math.random() * 16 ).toString( 16 );
  }

  return h;
}

function nextIndex( id ){
  return cache[ id ].nextIndex++;
}

function initTiles( tm ){
  tm.each( function( x, y, i ){
    var span = document.createElement( 'span' );
    var content = document.createTextNode( '' );

    span.appendChild( content );
    tm.viewport.appendChild( span );

    cache[ tm.id ].tiles[ i ] = span;
    cache[ tm.id ].textNodes[ i ] = content;
    cache[ tm.id ].className[ i ] = '';
    
    updatePosition( tm, x, y, i );
    
    tm.setColor( x, y, tm.fore, tm.back );            
  });
}

function updatePosition( tm, x, y, i ){
  var span = cache[ tm.id ].tiles[ i ];
  
  var position = {
    left: x * tm.charSize.width,
    top: y * tm.charSize.height
  };

  span.style.cssText = templates.tile( position );  
}

function getColorClass( tm, i ){
  var fore = cache[ tm.id ].fore[ i ];
  var back = cache[ tm.id ].back[ i ];

  var key = fore + ',' + back;
  
  return cache[ tm.id ].classMap[ key ];
}

module.exports = TextMode;