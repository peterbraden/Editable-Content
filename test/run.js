var wd = require('wd')
  , tests = require('./suite')
  , basic = require('./basic')
  
// Set up Command line options
var opts = require('nomnom')
  .option('username', {})  
  .option('apikey', {})
  .option('port', {default:80})
  .option('host', {default:"ondemand.saucelabs.com"})
  .option('url', {default: "http://peterbraden.co.uk/sandbox/Editable-Content/demo/basic.html"})
  .parse()

// Setup webdriver
if (opts.username)
  var browser = wd.remote(opts.host, opts.port, opts.username, opts.apikey)
else 
  var browser = wd.remote(opts.host, opts.port)


browser.init({browserName:"firefox"}, function() {
  browser.get(opts.url, function(){
    console.log("-- Browser Launched")
    tests.run(browser, function(){browser.close(function(){browser.quit()})})
  })
});  
