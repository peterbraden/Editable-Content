var suite = require('./suite')
  , assert = require('assert')
  , c = suite.callback

  , editor_id


//Setup
suite.test("Loading rich.html", function(browser, cb, e){
  browser.get(suite.base + '/richtext.html', cb)
})

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




//=== Bold 'Quick' ===

suite.test("Select 'quick'", function(browser, cb, e){
  browser.eval("window.Ed.focus().range(4, 9).select().toString()", c(e, function(e,o){
    assert.equal(o, 'quick')
    cb();
  }))
})

suite.test("Bold selection", function(browser, cb, e){
  browser.eval("window.Ed.execCommand('bold');",c(e, function(er,o){
    browser.eval("$('#output').text()" ,c(e, function(er,o){
        assert.equal(o,'The *quick* brown fox jumps over the lazy dog')
        cb();
      }))    
  }))
})  

suite.test("unbold selection", function(browser, cb, e){
  browser.eval("window.Ed.execCommand('bold');",c(e, function(er,o){
    browser.eval("$('#output').text()" ,c(e, function(er,o){
        assert.equal(o,'The quick brown fox jumps over the lazy dog')
        cb();
      }))    
  }))
})
