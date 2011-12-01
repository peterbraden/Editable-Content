/*
== Editable Content ==

== Examples: ==

Make a new editor and add to DOM:

    var e = new Editor()
    e.appendTo(".my_elem")
  
Convert a textarea to an Editor:

    var e = new Editor("#my_textarea")    

Listen to events: (acts very similar to jquery object)
    
    e.bind({
        'keyup' : myHandler
      , 'change' : myHandler
      , 'nodeChange': myHandler
    })

Get a normalised version of the editor's content:

    var html = e.html() // Normalised
      , text = e.val()
      , also_text = e.text()
    


Set the transform for normalisation:
  
    e.transformText({
      //   Selector  : HTML
          'bold' : '<strong />'
        , 'a' : '<span class="mock-link" />'
        , '.my_class' : function(text){return to_html(text)}
      }
    })

Or: 

    e.normalizeText = function(html){
      return my_normalize(html)
    }

---- Rough ideas: ---    



// bubble publisher

yam.ui.shared.typeAhead.registerField(ed.$, {
  onSelect : function(res, ta){
    var selection = ta.getSelection()
    ed.replace(selection, Mustache.to_html(bubble_template, res))
  })
  
...

typeahead.getSelection = function(){
  return ed.getSelection(ed.cursorPos() -1 * triggerLength, len)
}  
  
  

})



    
*/

yam.define(['$', '_', 'yam.dom'], function($,_, dom){
  
  // Shorthand for browser sniffing
  var in_webkit = $.browser.webkit
    , in_ie = $.browser.ie
    , in_mozilla = $.browser.mozilla
    , in_opera = $.browser.opera
  
  
  /*
  * Constructor for editor
  */
  yam.Editor = function(){
    if (!this instanceof yam.Editor){ // If someone forgets 'new' fix their mistake
      var ed = new yam.Editor()
      ed.init(arguments);
      return ed
    }
    this.init(arguments);
  } 
  var e = yam.Editor.prototype;
  
  
  /**
  */
  e.init = function(args){
    if (args.length > 0){
      // First arg is either a elem, jquery elem or selector
      this.$ = this.$elem = $(args[0])
      
    } else{
      throw "Not implemented 0 args yet"
    }
    
    // Setup element
    this.$elem[0].contentEditable = "true"
    this.$elem.attr('tabindex', this.$elem.attr('tabindex') || 0) //tabindex needed so it can be focused
    
    this.textTransforms = {}
    this.htmlTransforms = {}
    
    // Cache the value:
    this._val = this.$.text()
    
    this._bindEvents()
    
  }
  
  e._bindEvents = function(){
    this.$.bind({
      'keydown' : $.proxy(this._onkeydown, this)
    , 'keyup' :  $.proxy(this._onkeyup, this)
    , 'keypress' : $.proxy(this._onkeypress, this)
    , 'focus' : $.proxy(this._onfocus, this)
    , 'blur' : $.proxy(this._onblur, this)
    , 'paste' :  $.proxy(this._onpaste, this)
    })    
  }
  
  e._onkeydown = function(e){}
  e._onkeyup = function(e){
    this._checkChange()
  }
  
  e._onkeypress = function(e){}
  e._onfocus = function(e){}
  e._onblur = function(e){
    this._checkChange() 
  }
  e._onpaste = function(e){
    this._checkChange()
  }
  
  // Check if value has changed and if so fire change event
  e._checkChange = function(){
    var _val = this.$.text();
    if (_val != this._val){
      this._val = _val;
      this.$.trigger('change');
    }
  }
  
  e._normaliseBrowserText = function(e){
    var $elem = $(e) // not this.$elem!!!
    
    //TODO: Fun times!
    if(in_webkit) 
      $elem.find("div").replaceWith(function() { return "\n" + this.innerHTML; });    
    if(in_ie) 
      $elem.find("p").replaceWith(function() { return this.innerHTML  +  "<br>"; });
    if(in_mozilla || in_opera ||in_ie )
      $elem.find("br").replaceWith("\\n");
    
    return $elem.text()
  }
  
  
  /* Can be overridden
  */
  e.normalize = e.normalizeText = function(content){
    return content
  }
  
  e.normalizeHtml = function(){
    throw "Unimplemented normalise html"
  }
  
  /**
  Add a selector : transform for text or val output
  */
  e.transform = e.transformText = function(transforms){
    yam.mixin(this.textTransforms, transforms)
  }
  
  /*
  */
  e.html = function(){
    throw "Unimplemented html"
  }
  
  /*
  */
  e.text = e.val = function(){
    var text = this.$.clone()    
      , self = this    
     
    _.each(this.textTransforms, function(t, sel){
      text.find(sel).each(function(){
        $(this).replaceWith(t($(this)))
      })        
    })
    
    text = this.normalize(this._normaliseBrowserText(text))
    return text
  }
  
  e.rawText = function(){
    return this.$.text.apply(this.$, arguments)
  }
  
  /*
  */
  e.appendTo = function(){}
  
  /*
  */
  e.bind = function(){
    this.$.bind.apply(this.$, arguments)
    return this
  }
  
  e.trigger = function(){
    this.$.trigger.apply(this.$, arguments)
    return this
  }
  
  e.range = function(startInd, endInd){
    return dom.range(this.$[0], startInd, endInd)
  }
  
  e.wrap = function(startInd, endInd, elem){
    var cp = this.caretPos()
    this.range(startInd, endInd).wrap(elem)
    console.log("!!!>", cp)
    this.caretPos(cp) // if the bubble replaces user selection, the caret jumps to the beginning
    return this
  }
  
  e.caretPos = function(val){
    return yam.dom.selection.caretPos(this.$[0], val)
  }
  
  e.focus = function(){
    dom.selection.moveCursorToEnd(this.$[0])
    return this
  }
  
  e.append = function(){}
  
})