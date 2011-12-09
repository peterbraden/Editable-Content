var sys = require('sys')
  , colors = require('colors')


bcolors = {
    firefox : 'red'
  , iexplore : 'blue'
  , googlechrome : 'yellow'
}

var tests = []

var _tbs = []
exports.traceback = function(){
  if (exports.breakImmediately)
    console.log(Array.prototype.join.apply(arguments, [' ']))
  else 
    _tbs.push(Array.prototype.join.apply(arguments, [' ']))
}
 
exports.runTest= function(t, browser, cb){
  var bname = browser.desiredCapabilities.browserName
    , bcol = bcolors[bname] || 'green'
    , bversion = browser.desiredCapabilities.version
  
  
  var err = function(e){
   sys.print(('E')[bcol])
   exports.traceback("\n [" + bname[bcol] + bversion + "] Error: "
      , t[1], ">>> ", e.name, e.message, '\n', ("" + e.stack).substr(0, 250))
   cb()
  }
  
  try{
    t[0](browser, cb, err);
    sys.print(('.')[bcol])
  } catch(e){
    sys.print(('E')[bcol])
    err(e)
  } 
  
}
  
exports.report = function(){
  console.log(_tbs.join('\n\n'))
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
  
exports.run = function(browser, url, cb, i){
  var bname = browser.desiredCapabilities.browserName
     , bcol = bcolors[bname] || 'green'

  exports.base = url;
    
  if (!i)
    sys.print((">")[bcol])
  
  i = i || 0;
  
  if (i<tests.length){
    exports.runTest(tests[i], browser, function(){exports.run(browser, url, cb, i+1)})
  } else { 
    sys.print(("*")[bcol])
    cb()
  }  
}
  



