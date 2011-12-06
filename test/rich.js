var suite = require('./suite')
  , assert = require('assert')
  , c = suite.callback

  , editor_id


//Setup
suite.test("Loading rich.html", function(browser, cb, e){
  browser.get(suite.base + '/richtext.html', cb)
})