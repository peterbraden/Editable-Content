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
  browser.execute("window.Ed.execCommand('bold');",c(e, function(er,o){
    browser.eval("$('#output').text()" ,c(e, function(er,o){
        assert.equal(o,'The *quick* brown fox jumps over the lazy dog')
        cb();
      }))    
  }))
})  

suite.test("bold 'quick' .html()", function(browser, cb, e){
  browser.eval("window.Ed.html()",c(e, function(e,o){
    assert.equal(o,"The <strong>quick</strong> brown fox jumps over the lazy dog")
    cb();
  }))
})


suite.test("unbold selection", function(browser, cb, e){
  browser.execute("window.Ed.execCommand('bold');",c(e, function(er,o){
    browser.eval("$('#output').text()" ,c(e, function(er,o){
        assert.equal(o,'The quick brown fox jumps over the lazy dog')
        cb();
      }))    
  }))
})

suite.test("unbold 'quick' .html()", function(browser, cb, e){
  browser.eval("window.Ed.html()",c(e, function(e,o){
    assert.equal(o,"The quick brown fox jumps over the lazy dog")
    cb();
  }))
})



//=== Italic 'fox' ===

suite.test("Select 'fox'", function(browser, cb, e){
  browser.eval("window.Ed.focus().range(16, 19).select().toString()", c(e, function(e,o){
    assert.equal(o, 'fox')
    cb();
  }))
})

suite.test("italicise selection", function(browser, cb, e){
  browser.execute("window.Ed.execCommand('italic');",c(e, function(er,o){
    browser.eval("$('#output').text()" ,c(e, function(er,o){
        assert.equal(o,'The quick brown _fox_ jumps over the lazy dog')
        cb();
      }))    
  }))
})  

suite.test("italic 'fox' .html()", function(browser, cb, e){
  browser.eval("window.Ed.html()",c(e, function(e,o){
    assert.equal(o,"The quick brown <em>fox</em> jumps over the lazy dog")
    cb();
  }))
})

suite.test("unitalic selection", function(browser, cb, e){
  browser.execute("window.Ed.execCommand('italic');",c(e, function(er,o){
    browser.eval("$('#output').text()" ,c(e, function(er,o){
        assert.equal(o,'The quick brown fox jumps over the lazy dog')
        cb();
      }))    
  }))
})

suite.test("unitalic 'fox' .html()", function(browser, cb, e){
  browser.eval("window.Ed.html()",c(e, function(e,o){
    assert.equal(o,"The quick brown fox jumps over the lazy dog")
    cb();
  }))
})


// Bold, Italic Jumps
suite.test("Select 'jumps'", function(browser, cb, e){
  browser.eval("window.Ed.focus().range(20, 25).select().toString()", c(e, function(e,o){
    assert.equal(o, 'jumps')
    cb();
  }))
})

suite.test("italicise selection 'jumps'", function(browser, cb, e){
  browser.execute("window.Ed.execCommand('italic');",c(e, function(er,o){
    browser.eval("$('#output').text()" ,c(e, function(er,o){
        assert.equal(o,'The quick brown fox _jumps_ over the lazy dog')
        cb();
      }))    
  }))
})

suite.test("bold selection 'jumps'", function(browser, cb, e){
  browser.execute("window.Ed.execCommand('bold');",c(e, function(er,o){
    browser.eval("$('#output').text()" ,c(e, function(er,o){
        assert.equal(o,'The quick brown fox _*jumps*_ over the lazy dog')
        cb();
      }))    
  }))
})


suite.test("bold italic 'jumps' .html()", function(browser, cb, e){
  browser.eval("window.Ed.html()",c(e, function(e,o){
    assert.equal(o,"The quick brown fox <em><strong>jumps</strong></em> over the lazy dog")
    cb();
  }))
})

// Change to "Jumped"

suite.test('select "s"', function(browser, cb, e){
  browser.eval("window.Ed.range(24,25).select().toString();",c(e, function(e,o){
    assert.equal(o,"s")
    cb();
  }))
})
    

suite.test("yam.Editor type 'ed'", function(browser, cb, e){
  browser.type(editor_id, ["e", "d"], function(e){
    cb();
  })
})

suite.test("'jumped' value", function(browser, cb, e){
  browser.eval("$('#output').text()" ,c(e, function(er,o){
      assert.equal(o,'The quick brown fox _*jumped*_ over the lazy dog')
      cb();
  }))
})