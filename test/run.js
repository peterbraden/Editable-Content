var wd = require('wd')
  , tests = require('./suite')
  , basic = require('./basic')
  , rich = require('./rich')
  
// Set up Command line options
var opts = require('nomnom')
  .option('username', {})  
  .option('apikey', {})
  .option('port', {default:80})
  .option('host', {default:"ondemand.saucelabs.com"})
  .option('url', {default: "http://peterbraden.co.uk/sandbox/Editable-Content/demo"})
  .option('browser', {default:"firefox"})
  .parse()

// Setup webdriver
if (opts.username)
  var browser = wd.remote(opts.host, opts.port, opts.username, opts.apikey)
else 
  var browser = wd.remote(opts.host, opts.port)


browser.init({browserName:opts.browser}, function() {
  browser.get(opts.url, function(){
    console.log("-- Browser Launched")
    tests.run(browser, opts.url, function(){browser.close(function(){browser.quit()})})
  })
});  
