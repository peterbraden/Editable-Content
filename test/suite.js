var sys = require('sys')


var tests = []
 
exports.runTest= function(t, browser, cb){
  var err = function(e){
   sys.print('E')
   console.log("\n Error: ", t[1], ">>> ", e.name, e.message)
   console.trace();
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
  
exports.run = function(browser, cb){
  if (tests.length){
    exports.runTest(tests.shift(), browser, function(){exports.run(browser, cb)})
  } else { 
    console.log("DONE")
    cb()
  }  
}
  



