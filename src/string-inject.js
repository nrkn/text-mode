module.exports = function( template ){
  return eval( "(function(o){return '" +
    template.replace( /'/g, "\\'" )
    .replace( /<%=\s*/g, "'+o." )
    .replace( /\s*%>/g, "+'" ) +
    "'})"
  );
}