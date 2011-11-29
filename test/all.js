var sys = require('sys')
  , assert = require('assert')

var tests = []
 
exports.runTest= function(t, browser, cb){
  try{
    t(browser, cb);
    sys.puts('.')
  } catch(e){
    sys.puts('E')
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
  


exports.test("Testing page loaded jquery", function(browser, cb){
  browser.exec("window.$.fn.jquery", function(o){
    assert.equal(o,'1.4.2')
    cb();
  })
})

exports.test("Testing page loaded yam.Editor", function(browser, cb){
  browser.exec("typeof window.yam.Editor", function(o){
    assert.equal(o,'function')
    cb();
  })
})

exports.test("yam.Editor initial value", function(browser, cb){
  browser.exec("yam.Ed.$.text()", function(o){
    assert.equal(o,'The quick brown fox jumps over the lazy dog')
    cb();
  })
})

