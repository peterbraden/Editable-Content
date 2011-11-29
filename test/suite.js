var sys = require('sys')


var tests = []
 
exports.runTest= function(t, browser, cb){
  try{
    t(browser, cb);
    sys.print('.')
  } catch(e){
    sys.print('E')
    console.log(t.name, e)
  } 
}
  
exports.test= function(name, t){
  t.name = name
  tests.push(t);
}
  
exports.run = function(browser, cb){
  if (tests.length){
    exports.runTest(tests.pop(), browser, function(){exports.run(browser, cb)})
  } else { 
    console.log("DONE")
    cb()
  }  
}
  



