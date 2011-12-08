var sys = require('sys')


var tests = []
 
exports.runTest= function(t, browser, cb){
  var err = function(e){
   sys.print('E')
   console.log("\n Error: ", t[1], ">>> ", e.name, e.message, '\n', ("" + e.stack).substr(0, 200))
   cb()
  }
  
  try{
    t[0](browser, cb, err);
    sys.print('.')
  } catch(e){
    sys.print('E')
    err(e)
  } 
  
}
  
exports.test= function(name, t){
  t.name = name
  tests.push([t, name]);
}

//wrapp callbacks in error handling
exports.callback = function(err, cb){
  return function(){
    try{
      cb.apply(this, arguments)
    } catch (e){
      err(e)
    }
  }  
}
  
exports.run = function(browser, url, cb){
  exports.base = url;
  
  if (tests.length){
    exports.runTest(tests.shift(), browser, function(){exports.run(browser, url, cb)})
  } else { 
    console.log("DONE")
    cb()
  }  
}
  



