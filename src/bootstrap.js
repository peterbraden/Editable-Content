// polyfill for yam.core
yam = {}

yam.define = function(deps, func){
  libs = {
  	  '$' : $
  	, 'yam.$' : $
  	, '_' : _
  	, 'yam.dom': yam.dom
  }
  

	  console.log(deps, _.map(deps, function(v){return libs[v]}))
		func.apply(this, _.map(deps, function(v){return libs[v]}))	

}