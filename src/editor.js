/*
== Editable Content ==

Content Editable, but nicer.

// TODO

- selection change event    
    
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
      this.$ = this.$elem = (args[0] instanceof $)  ? args[0] : $(args[0])
      
    } else{
      throw "Not implemented 0 args yet"
    }
    
    // Setup element
    this.$elem[0].contentEditable = "true"
    this.$elem.attr('tabindex', this.$elem.attr('tabindex') || 0) //tabindex needed so it can be focused
    
    this.textTransforms = []
    this.htmlTransforms = []
    
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
    // input
   
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
  
  e._normaliseText = function(e){
    var $elem = $(e) // not this.$elem!!!
    
    //TODO: Fun times!
    
    // New Lines
    if(in_webkit)
      $elem.find("div").replaceWith(function() { return "\n" + this.innerHTML; });    
    if(in_ie) 
      $elem.find("p").replaceWith(function() { return this.innerHTML  +  "<br>"; });
    if(in_mozilla || in_opera ||in_ie )
      $elem.find("br").replaceWith("\\n");

    

    
    return $elem
  }
  
  var replaceTag = function(elem, tag){
    return $(elem).replaceWith($("<" + tag + ">" + elem.innerHTML + "</" + tag + ">"))
  }
  
  e._normalizeHTML = function(){
    var $elem = $('<pre />').append(this.$.clone())
    
    if(in_webkit){
      $elem.find('b').each(function(){replaceTag(this, 'strong')})
      $elem.find('i').each(function(){replaceTag(this, 'em')})
    }
  
    if(in_mozilla)
      $elem.find('span').each(function(){
        // Bold
        if (this.style.cssText == "font-weight: bold;"){
          replaceTag(this, 'strong')
        }
        // Italic
        if (this.style.cssText == "font-style: italic;"){
          replaceTag(this, 'em')
        }
        // Bold Italic
        if (this.style.cssText == "font-style: italic; font-weight: bold;"){
          replaceTag($(this).wrap('<em />')[0], 'strong')
        }   
        
      })
  
    return $elem
  }
  
  /* Can be overridden
  */
  e.normalize = e.normalizeText = function(content){
    return content
  }
  
  e.normalizeHtml = function(content){
    return content
  }
  
  /**
  Add a selector : transform for text or val output
  */
  e.transform = e.transformText = function(transforms){
   var self = this
    _.each(transforms, function(v,k){
      self.textTransforms.push([k, v])
    })
  }
  
  /*
  */
  e.html = function(){
    return this._normalizeHTML().children().html()
  }
  
  /*

  TODO - text is normalised '.text'
    val is text with substitutions applied

  */
  e.text = e.val = function(){
    if (arguments.length){
      this.$.text.apply(this.$, arguments)
    }
    
    var text = this._normaliseText(this._normalizeHTML().children())
      , self = this    
             
    _.each(this.textTransforms, function(t){
      text.parent().find(t[0]).each(function(){
        $(this).replaceWith(t[1]($(this)))
      })        
    })
    
    text = this.normalize(text)
    return text.text().replace('\n', '\\n')
      .replace(String.fromCharCode(160), ' ')// nbsp;
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

  e.unbind = function(){
    this.$.unbind.apply(this.$, arguments)
    return this
  }

  
  e.trigger = function(){
    this.$.trigger.apply(this.$, arguments)
    return this
  }
  
  e.parents = function(){
    return this.$.parents.apply(this.$, arguments)
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
    if (!range) throw "No Range for wrap"
    if (!elem) throw "No Element for wrap"

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

  /*
  Usage:
  e.replace(startInd, endInd, elem)
  e.replace(rangeObj, elem)
  */
  e.replace = function(){
    var range, elem;
    
    if (arguments.length == 2){
      range = arguments[0];
      elem = arguments[1];
    } else {
      elem = arguments[2];
      range = this.range(arguments[0], arguments[1])
    }

    range.replaceContents(elem);
    return this
  }
  
  e.focus = function(){
    dom.selection.moveCursorToEnd(this.$[0])
    this.$.trigger('focus');
    return this
  }
  
  e.append = function(elem){
    this.replace(this.caretPos(), this.caretPos(), elem)
    return this
  }
  
  // similar to browsers execCommand
  e.execCommand = function(command, showUI, value){
    // if this.isActive()  
    // if thisbrowser supports command
    document.execCommand(command, showUI, value); // TODO check!
    // else if we have fallback, use wrap
    this.trigger('change')
  }
  

  e.attr = function(){return this.$.attr.apply(this.$, arguments)}
  e.width = function(){return this.$.width.apply(this.$, arguments)}
  e.outerWidth = function(){return this.$.outerWidth.apply(this.$, arguments)}
  e.height = function(){return this.$.height.apply(this.$, arguments)}
  e.outerHeight = function(){return this.$.outerHeight.apply(this.$, arguments)}
  e.offset = function(){return this.$.offset.apply(this.$, arguments)}
  e.is = function(){return this.$.is.apply(this.$, arguments)}
})
