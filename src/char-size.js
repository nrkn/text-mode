function charSize( font, c ){
  var span = document.createElement( 'span' );

  document.body.appendChild( span );
  
  span.style.cssText = 'font: ' + font;
  span.appendChild( document.createTextNode( c || '╬' ) );
  
  var charSize = {
    width: span.offsetWidth,
    height: span.offsetHeight
  };
  
  document.body.removeChild( span );
  
  return charSize;
}

module.exports = charSize;  