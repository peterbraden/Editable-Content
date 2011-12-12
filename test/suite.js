var colors = require('colors')
  , assert = require('assert')

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
   process.stdout.write(('E')[bcol])
   exports.traceback("\n [" + bname[bcol] + bversion + "] Error: "
      , t[1], ">>> ", e.name, e.message, '\n', ("" + e.stack).substr(0, 250))
   cb()
  }
  
  try{
    t[0](browser, cb, err);
    process.stdout.write(('.')[bcol])
  } catch(e){
    process.stdout.write(('E')[bcol])
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
    process.stdout.write((">")[bcol])
  
  i = i || 0;
  
  if (i<tests.length){
    exports.runTest(tests[i], browser, function(){exports.run(browser, url, cb, i+1)})
  } else { 
    process.stdout.write(("*")[bcol])
    cb()
  }  
}
  

exports.assertSameHTML = function(res,control){
  assert.equal(res.toLowerCase().replace(/"/g, ''), control.toLowerCase().replace(/"/g, ''))
}


