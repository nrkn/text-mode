# Text Mode

## Character based display for the DOM

`npm install text-mode`

`bower install text-mode`

```javascript
  //appends to document.body
  var tm = new TextMode();
```

```javascript
  //appends to element matching selector
  var tm = new TextMode( '#viewport' );
```

```javascript
  var viewport = document.querySelector( '#viewport' );
  
  //appends to element
  var tm = new TextMode( viewport );
```  

```javascript
  //options (showing defaults)
  var tm = new TextMode({
    columns: 80,
    rows: 25,
    fore: '#ddd',
    back: '#222',
    font: '16px monospace'
  });
```

```javascript
  //target + options
  var tm = new TextMode( '#viewport', {
    font: '24px monospace'
  });
```

```javascript
  //draw
  var tm = new TextMode();
  
  tm.each( function( column, row ){
    tm.set( column, row, '@', '#fff', '#39f' );
  });
```  

```javascript  
  //get
  console.log( tm.get( 5, 5 ) );
```  

```javascript  
  //buffer
  var buffer = tm.get();
  
  tm.set( buffer );
```  