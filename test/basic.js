var suite = require('./suite')
  , assert = require('assert')
  , c = suite.callback

  , editor_id

// Assume we are on basic.html (TODO force)

//Sanity
suite.test("Testing page loaded jquery", function(browser, cb, e){
  browser.eval("window.$.fn.jquery", c(e, function(e,o){
    assert.equal(o,'1.4.2')
    cb();
  }))
})

//Sanity
suite.test("Testing page loaded yam.Editor", function(browser, cb, e){
  browser.eval("typeof window.yam.Editor", c(e, function(e,o){
    assert.equal(o,'function')
    cb();
  }))
})


//Sanity
suite.test("Testing editor element", function(browser, cb, e){
  browser.element("id", "editor", c(e, function(e,o){
    //store global:
    editor_id = o
    
    cb();
  }))
})

//Sanity
suite.test("yam.Editor initial value", function(browser, cb, e){
  browser.eval("window.Ed.rawText()", c(e, function(e,o){
    assert.equal(o,'The quick brown fox jumps over the lazy dog')
    cb();
  }))
})

// Editor should parse bubble with transform to _quick_
suite.test("yam.Editor initial value .text()", function(browser, cb, e){
  browser.eval("window.Ed.text();", c(e, function(e,o){
    assert.equal(e, null);
    assert.equal(o,'The _quick_ brown fox jumps over the lazy dog')
    cb();
  }))
})

// val == text
suite.test("yam.Editor initial value .val()", function(browser, cb, e){
  browser.eval("window.Ed.text()",c(e, function(e,o){
    assert.equal(o,'The _quick_ brown fox jumps over the lazy dog')
    cb();
  }))
})


// Focus on field
suite.test("yam.Editor focus", function(browser, cb, e){
  browser.eval("window.Ed.focus()", c(e, function(er,o){
    browser.active(c(e, function(e, o){
      //assert.equal(o, editor_id, "Editor id :" + editor_id + ", active: " + o);
      // Not necessarily div active, could be child element ^
      cb();
    }))
  }))
})

// Type 's'
suite.test("yam.Editor type 's'", function(browser, cb, e){
  browser.type(editor_id, ["s"], function(e){
    cb();
  })
})

suite.test("Change Event Fired", function(browser, cb, e){
  browser.eval("window._tests_changeFired", c(e, function(e,o){
    assert.equal(o, true)
    cb();
  }))
})

// new raw text
suite.test("new raw text after typing", function(browser, cb, e){
  browser.eval("window.Ed.rawText()", c(e, function(e,o){
    assert.equal(o,'The quick brown fox jumps over the lazy dogs')
    cb();
  }))
})

// new value/text
suite.test("New value after typing", function(browser, cb, e){
  browser.eval("window.Ed.text()", c(e, function(e,o){
    assert.equal(o,'The _quick_ brown fox jumps over the lazy dogs')
    cb();
  }))
})


