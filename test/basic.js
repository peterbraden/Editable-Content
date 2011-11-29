var suite = require('./suite')
  , assert = require('assert')

// Assume we are on basic.html (TODO force)

//Sanity
suite.test("Testing page loaded jquery", function(browser, cb){
  browser.exec("window.$.fn.jquery", function(o){
    assert.equal(o,'1.4.2')
    cb();
  })
})

//Sanity
suite.test("Testing page loaded yam.Editor", function(browser, cb){
  browser.exec("typeof window.yam.Editor", function(o){
    assert.equal(o,'function')
    cb();
  })
})

//Sanity
suite.test("yam.Editor initial value", function(browser, cb){
  browser.exec("window.Ed.rawText()", function(o){
    assert.equal(o,'The quick brown fox jumps over the lazy dog')
    cb();
  })
})

// Editor should parse bubble with transform to _quick_
suite.test("yam.Editor initial value .text()", function(browser, cb){
  browser.exec("window.Ed.text()", function(o){
    assert.equal(o,'The _quick_ brown fox jumps over the lazy dog')
    cb();
  })
})

// val == text
suite.test("yam.Editor initial value .val()", function(browser, cb){
  browser.exec("window.Ed.text()", function(o){
    assert.equal(o,'The _quick_ brown fox jumps over the lazy dog')
    cb();
  })
})


// val == text
suite.test("yam.Editor initial value .val()", function(browser, cb){
  browser.exec("window.Ed.text()", function(o){
    assert.equal(o,'The _quick_ brown fox jumps over the lazy dog')
    cb();
  })
})
