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
  *
  * Takes:
  *  @param {Selector/Element/jQuery Object}
  */
  yam.Editor = function(){
    if (!this instanceof yam.Editor){ // If someone forgets 'new' fix their mistake
      var ed = new yam.Editor()
      ed._init(arguments);
      return ed
    }
    this._init(arguments);
  } 
  var e = yam.Editor.prototype;
  
  
  /**
  * Internal
  */
  e._init = function(args){
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
  
  // Internal
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
  
  // Internal
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
  
  
  e._normaliseBrowserTextAfter = function(e){
    return e.text()
  }
  
  e._normaliseBrowserTextBefore = function(e){
    var $elem = $(e) // not this.$elem!!!
    
    //TODO: Fun times!
    
    // New Lines
    if(in_webkit) 
      $elem.find("div").replaceWith(function() { return "\n" + this.innerHTML; });    
    if(in_ie) 
      $elem.find("p").replaceWith(function() { return this.innerHTML  +  "<br>"; });
    if(in_mozilla || in_opera ||in_ie )
      $elem.find("br").replaceWith("\\n");

    

    if(in_mozilla)
      $elem.find('span').each(function(){
        // Bold
        if (this.style.cssText == "font-weight: bold;"){
          $(this).replaceWith("<b>" + this.innerHTML + "</b>")
        }
        // Italic
        if (this.style.cssText == "font-style: italic;"){
          $(this).replaceWith("<i>" + this.innerHTML + "</i>")
        }
        
      })
    
    
    return $elem
  }
  
  e._normalizeBrowserHTML = function(e){
    return this._normaliseBrowserTextBefore(e) // TODO
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
    return this.$.html()//this._normalizeBrowserHTML(this.$.contents().clone())
  }
  
  /*
  */
  e.text = e.val = function(){
    var text = this._normaliseBrowserTextBefore(this.$.clone())
      , self = this    
        
     
    _.each(this.textTransforms, function(t, sel){
      text.find(sel).each(function(){
        $(this).replaceWith(t($(this)))
      })        
    })
    
    text = this.normalize(this._normaliseBrowserTextAfter(text))
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
  
  e.find = function(){
    return this.$.find.apply(this.$, arguments)
  }
  
  e.range = function(startInd, endInd){
    return dom.range(this.$[0], startInd, endInd)
  }
  
  
  /*
  Usage:
  e.wrap(startInd, endInd, elem)
  e.wrap(selectionObj, elem)
  */
  e.wrap = function(){
    var range, elem;
    
    if (arguments.length == 2){
      range = arguments[0];
      elem = arguments[1];
    } else {
      elem = arguments[2];
      range = this.range(arguments[0], arguments[1])
    }

    var cp = this.caretPos()
    range.wrap(elem)
    this.caretPos(cp) // if the bubble replaces user selection, the caret jumps to the beginning
    return this
  }
  
  e.unwrap = function(elem){
    var cp = this.caretPos()
    $(elem).replaceWith($(elem).text())
    this.caretPos(cp) 
    return this;
  }
  
  e.caretPos = function(val){
    return yam.dom.selection.caretPos(this.$[0], val)
  }
  
  e.selection = function(){
    var sel = dom.selection();
    if (sel && sel.inside(this.$)){
      return sel
    }
  }
  
  e.focus = function(){
    dom.selection.moveCursorToEnd(this.$[0])
    return this
  }
  
  e.append = function(){}
  
  // similar to browsers execCommand
  e.execCommand = function(command, showUI, value){
    // if this.isActive()
    // if thisbrowser supports command
    document.execCommand(command, showUI, value); // TODO check!
    // else if we have fallback, use wrap
    this.trigger('change')
  }
  

  e.width = function(){return this.$.width.apply(this.$, arguments)}
  e.outerWidth = function(){return this.$.outerWidth.apply(this.$, arguments)}
  e.height = function(){return this.$.height.apply(this.$, arguments)}
  e.outerHeight = function(){return this.$.outerHeight.apply(this.$, arguments)}
  
  
})