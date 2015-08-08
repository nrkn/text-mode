(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// doT.js
// 2011-2014, Laura Doktorova, https://github.com/olado/doT
// Licensed under the MIT license.

(function() {
	"use strict";

	var doT = {
		version: "1.0.3",
		templateSettings: {
			evaluate:    /\{\{([\s\S]+?(\}?)+)\}\}/g,
			interpolate: /\{\{=([\s\S]+?)\}\}/g,
			encode:      /\{\{!([\s\S]+?)\}\}/g,
			use:         /\{\{#([\s\S]+?)\}\}/g,
			useParams:   /(^|[^\w$])def(?:\.|\[[\'\"])([\w$\.]+)(?:[\'\"]\])?\s*\:\s*([\w$\.]+|\"[^\"]+\"|\'[^\']+\'|\{[^\}]+\})/g,
			define:      /\{\{##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\}\}/g,
			defineParams:/^\s*([\w$]+):([\s\S]+)/,
			conditional: /\{\{\?(\?)?\s*([\s\S]*?)\s*\}\}/g,
			iterate:     /\{\{~\s*(?:\}\}|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\}\})/g,
			varname:	"it",
			strip:		true,
			append:		true,
			selfcontained: false,
			doNotSkipEncoded: false
		},
		template: undefined, //fn, compile template
		compile:  undefined  //fn, for express
	}, _globals;

	doT.encodeHTMLSource = function(doNotSkipEncoded) {
		var encodeHTMLRules = { "&": "&#38;", "<": "&#60;", ">": "&#62;", '"': "&#34;", "'": "&#39;", "/": "&#47;" },
			matchHTML = doNotSkipEncoded ? /[&<>"'\/]/g : /&(?!#?\w+;)|<|>|"|'|\//g;
		return function(code) {
			return code ? code.toString().replace(matchHTML, function(m) {return encodeHTMLRules[m] || m;}) : "";
		};
	};

	_globals = (function(){ return this || (0,eval)("this"); }());

	if (typeof module !== "undefined" && module.exports) {
		module.exports = doT;
	} else if (typeof define === "function" && define.amd) {
		define(function(){return doT;});
	} else {
		_globals.doT = doT;
	}

	var startend = {
		append: { start: "'+(",      end: ")+'",      startencode: "'+encodeHTML(" },
		split:  { start: "';out+=(", end: ");out+='", startencode: "';out+=encodeHTML(" }
	}, skip = /$^/;

	function resolveDefs(c, block, def) {
		return ((typeof block === "string") ? block : block.toString())
		.replace(c.define || skip, function(m, code, assign, value) {
			if (code.indexOf("def.") === 0) {
				code = code.substring(4);
			}
			if (!(code in def)) {
				if (assign === ":") {
					if (c.defineParams) value.replace(c.defineParams, function(m, param, v) {
						def[code] = {arg: param, text: v};
					});
					if (!(code in def)) def[code]= value;
				} else {
					new Function("def", "def['"+code+"']=" + value)(def);
				}
			}
			return "";
		})
		.replace(c.use || skip, function(m, code) {
			if (c.useParams) code = code.replace(c.useParams, function(m, s, d, param) {
				if (def[d] && def[d].arg && param) {
					var rw = (d+":"+param).replace(/'|\\/g, "_");
					def.__exp = def.__exp || {};
					def.__exp[rw] = def[d].text.replace(new RegExp("(^|[^\\w$])" + def[d].arg + "([^\\w$])", "g"), "$1" + param + "$2");
					return s + "def.__exp['"+rw+"']";
				}
			});
			var v = new Function("def", "return " + code)(def);
			return v ? resolveDefs(c, v, def) : v;
		});
	}

	function unescape(code) {
		return code.replace(/\\('|\\)/g, "$1").replace(/[\r\t\n]/g, " ");
	}

	doT.template = function(tmpl, c, def) {
		c = c || doT.templateSettings;
		var cse = c.append ? startend.append : startend.split, needhtmlencode, sid = 0, indv,
			str  = (c.use || c.define) ? resolveDefs(c, tmpl, def || {}) : tmpl;

		str = ("var out='" + (c.strip ? str.replace(/(^|\r|\n)\t* +| +\t*(\r|\n|$)/g," ")
					.replace(/\r|\n|\t|\/\*[\s\S]*?\*\//g,""): str)
			.replace(/'|\\/g, "\\$&")
			.replace(c.interpolate || skip, function(m, code) {
				return cse.start + unescape(code) + cse.end;
			})
			.replace(c.encode || skip, function(m, code) {
				needhtmlencode = true;
				return cse.startencode + unescape(code) + cse.end;
			})
			.replace(c.conditional || skip, function(m, elsecase, code) {
				return elsecase ?
					(code ? "';}else if(" + unescape(code) + "){out+='" : "';}else{out+='") :
					(code ? "';if(" + unescape(code) + "){out+='" : "';}out+='");
			})
			.replace(c.iterate || skip, function(m, iterate, vname, iname) {
				if (!iterate) return "';} } out+='";
				sid+=1; indv=iname || "i"+sid; iterate=unescape(iterate);
				return "';var arr"+sid+"="+iterate+";if(arr"+sid+"){var "+vname+","+indv+"=-1,l"+sid+"=arr"+sid+".length-1;while("+indv+"<l"+sid+"){"
					+vname+"=arr"+sid+"["+indv+"+=1];out+='";
			})
			.replace(c.evaluate || skip, function(m, code) {
				return "';" + unescape(code) + "out+='";
			})
			+ "';return out;")
			.replace(/\n/g, "\\n").replace(/\t/g, '\\t').replace(/\r/g, "\\r")
			.replace(/(\s|;|\}|^|\{)out\+='';/g, '$1').replace(/\+''/g, "");
			//.replace(/(\s|;|\}|^|\{)out\+=''\+/g,'$1out+=');

		if (needhtmlencode) {
			if (!c.selfcontained && _globals && !_globals._encodeHTML) _globals._encodeHTML = doT.encodeHTMLSource(c.doNotSkipEncoded);
			str = "var encodeHTML = typeof _encodeHTML !== 'undefined' ? _encodeHTML : ("
				+ doT.encodeHTMLSource.toString() + "(" + (c.doNotSkipEncoded || '') + "));"
				+ str;
		}
		try {
			return new Function(c.varname, str);
		} catch (e) {
			if (typeof console !== "undefined") console.log("Could not create a template function: " + str);
			throw e;
		}
	};

	doT.compile = function(tmpl, def) {
		return doT.template(tmpl, null, def);
	};
}());

},{}],2:[function(require,module,exports){
/* doT + auto-compilation of doT templates
 *
 * 2012, Laura Doktorova, https://github.com/olado/doT
 * Licensed under the MIT license
 *
 * Compiles .def, .dot, .jst files found under the specified path.
 * It ignores sub-directories.
 * Template files can have multiple extensions at the same time.
 * Files with .def extension can be included in other files via {{#def.name}}
 * Files with .dot extension are compiled into functions with the same name and
 * can be accessed as renderer.filename
 * Files with .jst extension are compiled into .js files. Produced .js file can be
 * loaded as a commonJS, AMD module, or just installed into a global variable
 * (default is set to window.render).
 * All inline defines defined in the .jst file are
 * compiled into separate functions and are available via _render.filename.definename
 *
 * Basic usage:
 * var dots = require("dot").process({path: "./views"});
 * dots.mytemplate({foo:"hello world"});
 *
 * The above snippet will:
 * 1. Compile all templates in views folder (.dot, .def, .jst)
 * 2. Place .js files compiled from .jst templates into the same folder.
 *    These files can be used with require, i.e. require("./views/mytemplate").
 * 3. Return an object with functions compiled from .dot templates as its properties.
 * 4. Render mytemplate template.
 */

var fs = require("fs"),
	doT = module.exports = require("./doT");

doT.process = function(options) {
	//path, destination, global, rendermodule, templateSettings
	return new InstallDots(options).compileAll();
};

function InstallDots(o) {
	this.__path 		= o.path || "./";
	if (this.__path[this.__path.length-1] !== '/') this.__path += '/';
	this.__destination	= o.destination || this.__path;
	if (this.__destination[this.__destination.length-1] !== '/') this.__destination += '/';
	this.__global		= o.global || "window.render";
	this.__rendermodule	= o.rendermodule || {};
	this.__settings 	= o.templateSettings ? copy(o.templateSettings, copy(doT.templateSettings)) : undefined;
	this.__includes		= {};
}

InstallDots.prototype.compileToFile = function(path, template, def) {
	def = def || {};
	var modulename = path.substring(path.lastIndexOf("/")+1, path.lastIndexOf("."))
		, defs = copy(this.__includes, copy(def))
		, settings = this.__settings || doT.templateSettings
		, compileoptions = copy(settings)
		, defaultcompiled = doT.template(template, settings, defs)
		, exports = []
		, compiled = ""
		, fn;

	for (var property in defs) {
		if (defs[property] !== def[property] && defs[property] !== this.__includes[property]) {
			fn = undefined;
			if (typeof defs[property] === 'string') {
				fn = doT.template(defs[property], settings, defs);
			} else if (typeof defs[property] === 'function') {
				fn = defs[property];
			} else if (defs[property].arg) {
				compileoptions.varname = defs[property].arg;
				fn = doT.template(defs[property].text, compileoptions, defs);
			}
			if (fn) {
				compiled += fn.toString().replace('anonymous', property);
				exports.push(property);
			}
		}
	}
	compiled += defaultcompiled.toString().replace('anonymous', modulename);
	fs.writeFileSync(path, "(function(){" + compiled
		+ "var itself=" + modulename + ", _encodeHTML=(" + doT.encodeHTMLSource.toString() + "(" + (settings.doNotSkipEncoded || '') + "));"
		+ addexports(exports)
		+ "if(typeof module!=='undefined' && module.exports) module.exports=itself;else if(typeof define==='function')define(function(){return itself;});else {"
		+ this.__global + "=" + this.__global + "||{};" + this.__global + "['" + modulename + "']=itself;}}());");
};

function addexports(exports) {
	for (var ret ='', i=0; i< exports.length; i++) {
		ret += "itself." + exports[i]+ "=" + exports[i]+";";
	}
	return ret;
}

function copy(o, to) {
	to = to || {};
	for (var property in o) {
		to[property] = o[property];
	}
	return to;
}

function readdata(path) {
	var data = fs.readFileSync(path);
	if (data) return data.toString();
	console.log("problems with " + path);
}

InstallDots.prototype.compilePath = function(path) {
	var data = readdata(path);
	if (data) {
		return doT.template(data,
					this.__settings || doT.templateSettings,
					copy(this.__includes));
	}
};

InstallDots.prototype.compileAll = function() {
	console.log("Compiling all doT templates...");

	var defFolder = this.__path,
		sources = fs.readdirSync(defFolder),
		k, l, name;

	for( k = 0, l = sources.length; k < l; k++) {
		name = sources[k];
		if (/\.def(\.dot|\.jst)?$/.test(name)) {
			console.log("Loaded def " + name);
			this.__includes[name.substring(0, name.indexOf('.'))] = readdata(defFolder + name);
		}
	}

	for( k = 0, l = sources.length; k < l; k++) {
		name = sources[k];
		if (/\.dot(\.def|\.jst)?$/.test(name)) {
			console.log("Compiling " + name + " to function");
			this.__rendermodule[name.substring(0, name.indexOf('.'))] = this.compilePath(defFolder + name);
		}
		if (/\.jst(\.dot|\.def)?$/.test(name)) {
			console.log("Compiling " + name + " to file");
			this.compileToFile(this.__destination + name.substring(0, name.indexOf('.')) + '.js',
					readdata(defFolder + name));
		}
	}
	return this.__rendermodule;
};

},{"./doT":1,"fs":3}],3:[function(require,module,exports){

},{}],4:[function(require,module,exports){
window.TextMode = require( './text-mode' );
},{"./text-mode":6}],5:[function(require,module,exports){
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
},{}],6:[function(require,module,exports){
'use strict';

var template = require( 'dot' ).template;
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
  style: template( '{{=it.selector}} { {{=it.rule}} }' ),
  color: template( 'background: {{=it.back}}; color: {{=it.fore}};' ),
  viewport: template( 'position: relative; width: {{=it.size.width}}px; height: {{=it.size.height}}px; font: {{=it.font}}' ),
  tiles: template( 'position: absolute; line-height: {{=it.height}}px; width: {{=it.width}}px; height: {{=it.height}}px;' ),
  tile: template( 'top: {{=it.top}}px; left: {{=it.left}}px;' )
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
},{"./char-size":5,"dot":2}]},{},[4]);
