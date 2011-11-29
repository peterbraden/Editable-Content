var wd = require('wd')
  , tests = require('./all')

  
// Set up Command line options
var opts = require('nomnom')
  .option('username', {})  
  .option('apikey', {})
  .option('port', {default:80})
  .option('host', {default:"ondemand.saucelabs.com"})
  .option('url', {default: "http://peterbraden.co.uk/sandbox/Editable-Content/demo/basic.html"})
  .parse()

// Setup webdriver
var browser = wd.remote(opts.host, opts.port, opts.username, opts.apikey)


browser.init({browserName:"chrome"}, function() {
  browser.get(opts.url, function(){
    console.log("-- Browser Launched")
    tests.run(browser, function(){browser.close(browser.quit)})
  })
});  
