var suite = require('./suite')
  , assert = require('assert')
  , assertSameHTML = suite.assertSameHTML
  , c = suite.callback

  , editor_id


//setup
suite.test("Loading page", function(browser, cb, e){
  browser.get(suite.base + '/basic.html', cb)
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


suite.test("yam.Editor initial value .html()", function(browser, cb, e){
  browser.eval("window.Ed.html()",c(e, function(e,o){
    assertSameHTML(o,'The <span class="bubble">quick</span> brown fox jumps over the lazy dog')
    cb();
  }))
})



suite.test("Dom range sanity (1)", function(browser, cb, e){
    browser.execute("new yam.dom.Range(window.Ed.$[0], 1, 6).toString()",c(e, function(e,o){
      cb();
    }))
  })


suite.test("Dom range sanity", function(browser, cb, e){
    browser.execute("new yam.dom.Range(window.Ed.$[0], 1, 6)",c(e, function(e,o){
      cb();
    }))
  })


suite.test("Range all text (sanity)", function(browser, cb, e){
  browser.eval("yam.dom.range(window.Ed.$[0], 0, 43).toString()", c(e, function(e,o){
    assert.equal(o,'The quick brown fox jumps over the lazy dog')
    cb();
  }))
})





suite.test("Range method", function(browser, cb, e){
    browser.eval("window.Ed.range(1, 6).toString()",c(e, function(e,o){
      assert.equal(o,'he qu')
      cb();
    }))
  })






// ==== Mutate field ========

suite.test("temp", function(browser, cb, e){
  browser.eval("yam.dom.selection.moveCursorToEnd(window.Ed.$[0])", c(e, function(er,o){
    cb()
  }))
})

// Focus on field
suite.test("yam.Editor focus", function(browser, cb, e){
  browser.execute("window.Ed.focus()", c(e, function(er,o){
    //browser.active(c(e, function(e, o){
      //assert.equal(o, editor_id, "Editor id :" + editor_id + ", active: " + o);
      // Not necessarily div active, could be child element ^
      cb();
    //}))
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

// new value/text
suite.test("Wrap 'fox' in bubble", function(browser, cb, e){
  browser.eval("window.Ed.wrap(16, 19, '<span class="+'"bubble"' + " />').trigger('paste').text()", c(e, function(e,o){
    if (e){}
      //throw e
    assert.equal(o,'The _quick_ brown _fox_ jumps over the lazy dogs')
    cb();
  }))
})


suite.test("fox in bubble .html()", function(browser, cb, e){
  browser.eval("window.Ed.html()",c(e, function(e,o){
    assertSameHTML(o, 'The <span class="bubble">quick</span> brown <span class="bubble">fox</span> jumps over the lazy dogs')
    cb();
  }))
})

// Caret Pos
suite.test("caret is at end", function(browser, cb, e){
  browser.eval("window.Ed.focus().caretPos()", c(e, function(e,o){
    assert.equal(o,44)
    cb();
  }))
})


// Uncontenteditable bubble
suite.test("Wrap 'lazy' in bubble", function(browser, cb, e){
  browser.eval("window.Ed.wrap(35, 39, '<span contenteditable=" + '"false"' + " class="+'"bubble"' + " />').trigger('paste').text()", c(e, function(e,o){
    if (e){}
      //throw e
    assert.equal(o,'The _quick_ brown _fox_ jumps over the _lazy_ dogs')
    cb();
  }))
})

suite.test("Place caret in in selectable bubble", function(browser, cb, e){
  browser.execute('window.Ed.range(35,35).select().toString(); window.Ed.caretPos()', c(e, function(e,o){
    cb()
  }))
})  

/*
// Type 'a's'
suite.test("yam.Editor type 'aaa'", function(browser, cb, e){
  browser.type(editor_id, ["a", "a", "a"], function(e2){
    browser.eval("window.Ed.text()",c(e, function(e3,o){
      assert.equal(o, 'The _quick_ brown _fox_ jumps over the _lazy_ dogs')
      cb();
    }))
  })
})

*/

// Type in middle of sentence
suite.test("Place caret in '|brown'", function(browser, cb, e){
  browser.execute('window.Ed.range(10,10).select().toString(); window.Ed.caretPos()', c(e, function(e,o){
    cb()
  }))
})

suite.test("yam.Editor type 'aaa'", function(browser, cb, e){
  browser.type(editor_id, ["d", "a", "r", "k", " "], function(e2){
    browser.eval("window.Ed.text()",c(e, function(e3,o){
      assert.equal(o, 'The _quick_ dark brown _fox_ jumps over the _lazy_ dogs')
      cb();
    }))
  })
})


// Insert 

suite.test(".replace(range, text)", function(browser, cb, e){
  browser.eval("window.Ed.replace(window.Ed.range(0, 3), 'A cunning ')",c(e, function(e3,o){
    assert.equal(o, "A cunning _quick_ dark brown _fox_ jumps over the _lazy_ dogs");
    cb();
  }))
})

