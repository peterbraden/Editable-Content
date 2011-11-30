var suite = require('./suite')
  , assert = require('assert')

// Assume we are on basic.html (TODO force)

//Sanity
suite.test("Testing page loaded jquery", function(browser, cb){
  browser.eval("window.$.fn.jquery", function(e,o){
    assert.equal(o,'1.4.2')
    cb();
  })
})

//Sanity
suite.test("Testing page loaded yam.Editor", function(browser, cb){
  browser.eval("typeof window.yam.Editor", function(e, o){
    assert.equal(o,'function')
    cb();
  })
})

//Sanity
suite.test("yam.Editor initial value", function(browser, cb){
  browser.eval("window.Ed.rawText()", function(e, o){
    assert.equal(o,'The quick brown fox jumps over the lazy dog')
    cb();
  })
})

// Editor should parse bubble with transform to _quick_
suite.test("yam.Editor initial value .text()", function(browser, cb){
  browser.eval("window.Ed.text()", function(e, o){
    assert.equal(o,'The _quick_ brown fox jumps over the lazy dog')
    cb();
  })
})

// val == text
suite.test("yam.Editor initial value .val()", function(browser, cb){
  browser.eval("window.Ed.text()", function(e, o){
    assert.equal(o,'The _quick_ brown fox jumps over the lazy dog')
    cb();
  })
})


// Focus on field
suite.test("yam.Editor focus", function(browser, cb){
  browser.eval("window.Ed.focus()", function(e, o){
    browser.active(function(){
      console.log("!!!", arguments)
      // What to test?
      cb();
    })
  })
})

// Type 'a'
suite.test("yam.Editor type 's'", function(browser, cb){
  browser.type("editor", ["s"], function(e){
    cb();
  })
})

suite.test("Change Event Fired", function(browser, cb, err){
  browser.eval("window._tests_changeFired", function(e, o){
    assert.equal(o, true)
    cb();
  })
})

// new raw text
suite.test("new raw text after typing", function(browser, cb){
  browser.eval("window.Ed.rawText()", function(e, o){
    assert.equal(o,'The quick brown fox jumps over the lazy dogs')
    cb();
  })
})

// new value/text
suite.test("New value after typing", function(browser, cb){
  browser.eval("window.Ed.text()", function(e, o){
    assert.equal(o,'The _quick_ brown fox jumps over the lazy dogs')
    cb();
  })
})


