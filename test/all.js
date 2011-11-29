var tests = []

exports = {
  
  runTest: function(test, browser, cb){
    test(browser, cb);
  }
  
  , test: function(t){
    tests.push(t);
  }
  
  , run : function(browser, cb){
    if (tests){
      exports.runTest(tests.pop(), browser, exports.run)
    } else { 
      cb()
    }  
      
  }
  
}


exports.test(function(browser, cb){
  console.log("Testing page loaded jquery")
  browser.exec("window.$", function(o){
    console,log(o)
    cb();
  })
  
})