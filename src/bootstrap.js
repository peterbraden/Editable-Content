// polyfill for yam.core
yam = {}

yam.define = function(deps, func){
  libs = {
  	  '$' : $
  	, 'yam.$' : $
  	, '_' : _
  	, 'yam.dom': yam.dom
  }
  
	func.apply(this, _.map(deps, function(v){return libs[v]}))	

}

