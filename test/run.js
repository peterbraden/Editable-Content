var wd = require('wd')
  , _ = require('underscore')
  , tests = require('./suite')
  
  , basic = require('./basic')
  //, rich = require('./rich')
   // , scratch = require('./scratchpad')
    
// Set up Command line options
var opts = require('nomnom')
  .option('username', {})  
  .option('apikey', {})
  .option('port', {default:80})
  .option('host', {default:"ondemand.saucelabs.com"})
  .option('url', {default: "http://yammer.github.com/Editable-Content/demo"})
  .option('browser', {default:"firefox@4"})
  .option('breakImmediately', {default:false})
  .parse()

var running = 0

var done = function(){
  if (running>1) {
    running -=1;
  } else {
    tests.report();
    process.exit(tests.errors().length)
  }
}


_.each(opts.browser.split(','), function(x){
  running +=1;
  
  // Setup webdriver
  if (opts.username)
    var browser = wd.remote(opts.host, opts.port, opts.username, opts.apikey)
  else 
    var browser = wd.remote(opts.host, opts.port)

  
  
  var s = x.split('@')
    , b = s[0]
    , v = (s.length > 1) ? s[1] : undefined
  
  tests.breakImmediately = opts.breakImmediately
  
  browser.init({browserName:b, version:v, platform: (v==9)?'VISTA':"XP", 'public':true}, function() {
    browser.get(opts.url + '/basic.html', function(){
      tests.run(browser, opts.url, function(){browser.close(function(){
        done();
        browser.quit()
      })})
    })
  });  
  
  
  
})
