/**
* yam.dom is an abstraction layer on top of the dom, for things that jquery doesn't abstract.
*
* At present it contains:
* - yam.dom.keyboard : Keyboard shortcuts
* - yam.dom.selection : Abstractions for the browsers 'selection' interface
*
*/

yam.define(['yam.$'], function($){

yam.dom = {}


/**
*   === Keyboard events ===
* 
*  To bind functionality to a keyboard shortcut we can do something like:
*
*      yam.keyboard.bind('ctrl x', myhandler)
*
*  The shortcut is a space delimited string of characters needed to activate the 
*  callback, and we support symbols, thus:
*  
*  - '$' is equivalent to 'shift 4'
*  - '⌘ c' is equivalent to 'command c'
*
* Inspiration from https://github.com/OscarGodson/jKey/blob/master/jquery.jkey.js
*/

var c = yam.dom.keycodes = {
  'a' : 65, 'b' : 66, 'c' : 67, 'd' : 68, 'e' : 69, 'f' : 70, 'g' : 71, 'h' : 72, 'i' : 73, 'j' : 74,
  'k' : 75, 'l' : 76, 'm' : 77, 'n' : 78, 'o' : 79, 'p' : 80, 'q' : 81, 'r' : 82, 's' : 83, 't' : 84,
  'u' : 85, 'v' : 86, 'w' : 87, 'x' : 88, 'y' : 89, 'z' : 90,
  
  '0' : 48, '1' : 49,'2' : 50, '3' : 51, '4' : 52, '5' : 53, '6' : 54, '7' : 55, '8' : 56,'9' : 57
  , '!': '16 49', '@': '16 50', '#': '16 51', '$': '16 52', '%' : '16 53', '^' : '16 54'
  , '&' : '16 55', '*': '16 56', '(' : '16 9', ')': '16 48' 
  
  ,  'f1' : 112, 'f2' : 113, 'f3' : 114, 'f4' : 115, 'f5' : 116
  , 'f6' : 117, 'f7' : 118, 'f8' : 119, 'f9' : 120, 'f10': 121
  , 'f11': 122, 'f12': 123
    
  , 'shift' : 16, '⇧' : 16
  , 'ctrl' : 17, 'control' : 17
  , 'alt' : 18, 'option' : 18, 'opt' : 18, '⌥' : 18
  , 'command' : 224, 'cmd' : 224, '⌘': 224 //Mac OS key
  , 'fn' : 255, 'function' : 255//tested on Lenovo ThinkPad
    
  , 'backspace' : 8, 'osxdelete' : 8,
    'enter' : 13, 'return' : 13, '↵' : 13,
    'space':32, 'spacebar':32,
    'esc':27, 'escape':27,
    'tab':9,
    'capslock':20, 'capslk':20,
    'super':91, 'windows':91,
    'insert':45,
    'delete':46, //NOT THE OS X DELETE KEY!
    'home':36,
    'end':35,
    'pgup':33, 'pageup':33,
    'pgdn':34, 'pagedown':34,
    
    'left' : 37, '←': 37,
    'up'   : 38, '↑' : 38,
    'right': 39, '→' : 39,
    'down' : 40, '↓' : 40,
    
    '`':96, '~':'16 96',
    '-':45, '_':'16 45',
    '=':187, '+':'16 187',
    '[':219, '{':'16 219',
    ']':221, '}':'16 221',
    '\\':220, // it's actually a \ but there's two to escape the original
    '|':'16 220',
    ';':59, ':':'16 59',
    "'":222, '"':'16 222',
    ',':188, '<':'16 188',
    '.':190, '>':'16 190',
    '/':191, '?':'16 191'
		};

var k = yam.dom.keyboard = {
  bound : false
  , handlers : {}
  , active : ''
  , KEYPRESS_DELAY : 300
  
  /**
  * Bind a callback to a key combo
  *
  * @param {String} keycombo A space delimited key combo
  * @param {Function} callback An event handler to be fired
  * @param {Selector} [scope] Limit the callback to events fired within a scope
  */
  , bind : function(keycombo, callback, optional_scope){      
    // Lazy bind document events: don't bog down the DOM unless we need
    if (!k.bound){
      $(document).bind({
          'keydown.yamdom': yam.dom.keyboard._handleKeydown
        , 'keyup.yamdom': yam.dom.keyboard._handleKeyup
        , 'keypress.yamdom' : yam.dom.keyboard._handleKeypress
      })
      yam.dom.keyboard.bound = true;
    }
    // Substitute char codes for symbols
    var code = _.map(keycombo.split(' '), function(x){return c[x]}).join(' ')
    // Add handlers
    k.handlers[code] = {cb:callback, scope:optional_scope}
  }
  
  , _handleKeydown: function(e){
    if (k._interval){
      clearTimeout(k._interval)
      delete k._interval;
    }  
    
    k.active += e.keyCode + ' ';
  
    _.each(k.handlers, function(handler, combo){
      if (e.isPropagationStopped()) //Previous handler may have cancelled propagation
        return;
      
      if (k.active == combo + ' '){
        if (handler.scope){
          if ($(scope).find($(e.target)).length)
            handler.cb(e)
        } else {
          handler.cb(e)
        }
        k._reset();
      }
    })
  }
  
  /* On keyup, we want to delay a little bit before resetting our active
  *  combo, in case the user upkeys before the next key goes down under a 
  *  threshold.
  *  Shift should immediately rest though, as the expectation is you have
  *  to _hold_down_ shift to get the uppercase
  */
  , _handleKeyup: function(e){
    if (e.keyCode == c['shift']){
      k._reset(); // shift should clear immediately
    } else {
      k._interval = setTimeout(k._reset, k.KEYPRESS_DELAY)
    }  
  }
  , _handleKeypress: function(){}
  
  , _reset: function(e){
    k.active = ''
  }
}  




/**
Tools for working with selections and ranges, including getting caret positions etc.

https://developer.mozilla.org/en/DOM/range
http://www.quirksmode.org/dom/range_intro.html

*/


var eachText = function(elem, cb){ 
  if ($(elem)[0].nodeType == 3)
    return cb(elem)

  $(elem).contents().each(function(){
    if (this.nodeType == 3) // Text
      cb(this)
    else if (this.nodeType == 1) // Element
      eachText(this, cb)
  })
}


var isModernRangeImpl = function(){
  return (!! document.createRange);
}

var isIERangeImpl = function(){
  return (!! document.selection && document.selection.createRange)
}

yam.dom.Range = function(){
  switch (arguments.length){
    case 1:
      this._initRaw(arguments[0])
      break;
    
    case 3:
      this._initFromIndices.apply(this, arguments)
      break;
      
    default:
      throw "wrong arguments for new Range"  
  }
}


yam.dom.range = function(elem, start, end){
  return new yam.dom.Range(elem, start, end)
} 
 
  
var r = yam.dom.Range

r.prototype._initFromIndices = function(elem, start, end){
  var $elem = $(elem)
  , _text = $elem.text()
  , self = this
  , startset = endset = false

  // Sanity Checking
  if (_text.length < end)
    throw "Range end exceeds element length:" + end + " > " + _text.length   
  if (_text.length < start)
    throw "Range start exceeds element length: " + start + " > " + _text.length    


  if (isModernRangeImpl()) {
  
    this.raw = document.createRange();
    // Descend into nodes to find actual start
    var i = 0
      , last

    eachText(elem, function(text){
      var len = text.nodeValue.length
      if (i + len > start && !startset){
        self.raw.setStart(text, start-i);
        startset=true;
      }  
      if (i + len >= end && !endset){
        self.raw.setEnd(text, end-i);
        endset=true;
      }  
      last = text
      i += len
    })

    if (last && !endset)
      self.raw.setEnd(last, end);
    
    if (start == end)
      self.raw.collapse(false) // For some reason, this must be the end or firefox cant select last char.
    
  } else if (document.selection && document.selection.createRange) { // IE
    this.raw = document.selection.createRange().duplicate()
    this.raw.moveToElementText(elem);
    var z = this.raw.text
    this.raw.collapse(true);
    var x = this.raw.moveStart('character', start);
    var y = this.raw.moveEnd('character', end - start);
  
    window.DEBUG0 = window.DEBUG0 || []
    
    var a = document.selection.createRange().duplicate()
    a.moveToElementText(elem)
    a.collapse(true)
    a.moveEnd('character', end);
    window.DEBUG0.push(["!!", this.raw.text, end, start, x, y,z, z.length, a.text, a.text.length]); 
    
  }
    
  
}  

r.prototype._initRaw = function(raw){
  this.raw = raw
}
  
r.prototype.toString = function(){
  return document.createRange ? this.raw.toString() : this.raw.text
}  

r.prototype.wrap = function(elem){
  if (isModernRangeImpl()) {
    // We don't attempt to solve the problem of partial selection, in
    // that case a Range exception will be thrown.
    this.raw.surroundContents($(elem)[0])
  } else if (document.selection){ //IE8-
    var frag = $(elem).append(this.raw.htmlText + "")
    this.raw.pasteHTML(frag[0].outerHTML)
  }	  
}

r.prototype.inside = function(elem){
  return !!$(elem).has(this.raw.commonAncesterContainer)
}

// Set range as user selection
r.prototype.select = function(){
  // http://stackoverflow.com/questions/4183401/can-you-set-and-or-change-the-users-text-selection-in-javascript
  if (window.getSelection && isModernRangeImpl()) {
    var sel = window.getSelection()
    sel.removeAllRanges();
    sel.addRange(this.raw);
  } else if (document.selection && document.body.createTextRange) {
    this.raw.select();
  }
  
  return this;
}

r.prototype.insert = function(elem){
  if (isModernRangeImpl()) {
    var node = (typeof elem == 'string') ? document.createTextNode(elem) : $(elem)[0]
    this.raw.insertNode(node)
  } else if (isIERangeImpl()){
    this.raw.collapse(true);
    if (typeof elem == 'string'){
     this.raw.text = elem; //preserve leading spaces by setting text
    } else {
     this.raw.pasteHTML($(elem).html());
    } 
  }  

}

r.prototype.deleteContents = function(){
  if (isModernRangeImpl()) {
    if (!this.raw.collapsed)
      this.raw.deleteContents(); 
  } else if (isIERangeImpl()){
    this.raw.text = "" // For some reason pasteHTML creates an empty space so use .text
  } 
}

r.prototype.replaceContents = function(elem){
  this.deleteContents();
  this.insert(elem);
}




 /**
*  Internal
*/
var _setCaretPosInput = function(elem, pos){
  elem = elem.length ? elem[0] : elem;

  if (elem.setSelectionRange) {
    elem.focus();
    elem.setSelectionRange(pos, pos);
  } else if (elem.createTextRange) { // IE
    var range = elem.createTextRange();
    range.collapse(true);
    range.moveEnd('character', pos);
    range.moveStart('character', pos);
    range.select();
  }
}


/**
*  Internal
*/
var _getCaretPosInput = function(elem){
  var $elem = elem instanceof jQuery ? elem : $(elem);

   if (document.selection) {
     var i = $elem.val().length + 1;
     if ($elem[0].createTextRange) {
       var theCaret = document.selection.createRange().duplicate();
       while (theCaret.parentElement() == $elem[0] && theCaret.move("character", 1) == 1) { 
         --i; 
       }
     }
     return i == $elem.val().length + 1 ? -1 : i;
   } else {
     // prevents FF error: uncaught exception: [Exception... "Component returned failure code: 0x80004005 (NS_ERROR_FAILURE) [nsIDOMNSHTMLTextAreaElement.selectionStart]" nsresult: "0x80004005 (NS_ERROR_FAILURE)" location: "JS frame :: http://yammer.local/javascripts/yamjs/yamjs-ui.js?1285620093 :: anonymous :: line 8606" data: no] 
     var caretPos = $elem.is(':visible') ?
         $elem[0].selectionStart :
         0;
     return caretPos;
   }
  
}

/**
*  Internal
*/
var _getCaretPosContentEditable = function (elem) {
  elem = elem instanceof jQuery ? elem[0] : elem; //_not_ jquery
  if (window.getSelection && window.getSelection().getRangeAt) { // Good Browsers
    /*
    *  Because the caret position is from the start of the element, and may be in a sub element,
    *  what we do is create a selection from the beginning of the element to the end, then look 
    *  at it's contents jquery text length which will include child elements.
    */
    var sel = window.getSelection().getRangeAt(0).cloneRange();
    sel.setEnd(sel.startContainer, sel.startOffset)
    
    // this little ninja bit of jquery means that we are setting the start of the range to 
    // the first child of the contenteditable, which is usually a text node
    var sc = sel.startContainer
    sc = (sc.nodeType == 3) ? sc.parentNode : sc // Make sure sc is not text node
    sel.setStart($(sc).parents().add(sc).filter('[contenteditable="true"], [contenteditable="plaintext-only"]')[0].firstChild, 0) 
    var range = sel.cloneContents()
    
    return range.textContent.length 
  } else if (document.selection) { // IE
      /*
      * This took a looong time to work out.
      * Basically, we copy the range, expand it to the contenteditable element,
      * then calculate offsets from the difference.
      * IE Sux.
      */
    
      var range = document.selection.createRange()
        , elemr = range.duplicate()
        , par =  $(elem).parents().add(elem).filter('[contenteditable="true"], [contenteditable="plaintext-only"]')
      
      range.collapse(true)  
      elemr.moveToElementText(par[0]);    	
      elemr.setEndPoint('EndToStart', range);        
      return elemr.text.length;
      
  } else {
    throw "Aaaaargh, not in a known browser. CaretPos not implemented"
  }
};


// Traverse down over an element to text leaves, calling cb on each in order
// We could use a treewalker, but this should work in IE as well
var _traverseToTextNodes = function(elem, cb){
  if (elem.nodeType == 1){ // Element 
    if (elem.hasChildNodes()){
      var c = elem.childNodes
      for (var i = 0; i<c.length; i++){
        _traverseToTextNodes(c[i], cb)
      }
    }
  } else if (elem.nodeType == 3){ // Text
    cb(elem)
  }   
}



var _setCaretPosContentEditable = function (elem, position){
  if (window.getSelection && window.getSelection().getRangeAt) { // Good Browsers
    var called = false;

    // Element here needs to be text node:
    _traverseToTextNodes(elem, function(e){
      if (called) return;
      
      if (position <= e.data.length){ // if position is in this textnode
        var range = document.createRange();
        range.setStart(e, position)
        range.setEnd(e, position)
        
        window.getSelection().removeAllRanges();     
        window.getSelection().addRange(range)
        called = true;
      } else {
        // position is not in this elem - decrement position by this length
        position-=e.data.length
      }          
    })     
          
    if (!called){
      throw "yam.selection index error - not called"
    }      

    
  } else if (document.selection && document.selection.createRange) { // IE   
      range = document.body.createTextRange();
      range.moveToElementText(elem);
      range.collapse(true);
      range.moveEnd('character', position);
      range.moveStart('character', position);
      range.select();
  }
}


yam.dom.selection = function(){
  if (window.getSelection && window.getSelection().getRangeAt) { // Good Browsers
    return new yam.dom.Range(window.getSelection().getRangeAt(0));
  } else if (document.selection && document.selection.createRange) { // IE
    return new yam.dom.Range(document.selection.createRange());
  } else {
    throw "Unknown browser - not sure how to get user selection"
  }
}

var s = yam.dom.selection




/*
*  get or set caret position in an input, textarea or contenteditable div
*  @param {element / $element} elem The container with the cursor in - note, 
*                             if the cursor is not in the container, behaviour is undefined
*  @param {int} [pos] The position to set the caret.
*/ 
s.caretPos= function(elem, _pos){
  if (_pos){
    return $(elem).is('input, textarea') ? _setCaretPosInput(elem, _pos) : _setCaretPosContentEditable(elem, _pos)
  }
  return $(elem).is('input, textarea') ? _getCaretPosInput(elem) : _getCaretPosContentEditable(elem)
}  

/*
*  Get coords of caret
*/
s.caretCoords= function(elem){
  s.storeSelections()
  
  $('.yj-ghost').remove();
  var phantom = "<span class='yj-ghost'>I</span>"
  s.replaceTextSubstr(s.caretPos(), s.caretPos(), phantom)
  var $phantom = $('.yj-ghost')
  var pos = $phantom.position()
  pos.height = $phantom.height() 
  $phantom.remove()
  
  return pos
}

/*
*  Careful! : range here is browser specific.
*/ 
s.replaceRange= function(range, html){
  if (window.getSelection && window.getSelection().getRangeAt) { // Good Browsers
    var node = range.createContextualFragment(html);
    range.deleteContents();
    range.insertNode(node);
  } else if (document.selection && document.selection.createRange) { // IE
    range.pasteHTML(html)
  }  
}


s.replaceTextSubstr= function(startindex, endindex, html){
  s.storeSelections();
  
  var range;
  
  // Insert fragment - I bet DOJO has a method for this...
  if (window.getSelection && window.getSelection().getRangeAt) { // Good Browsers
    var range = window.getSelection().getRangeAt(0);
    range.setStart(range.startContainer, startindex)
    range.setEnd(range.startContainer, endindex)
  } else if (document.selection && document.selection.createRange) { // IE
    var range = document.selection.createRange()
    //TODO position
  } 
  
  s.replaceRange(range, html) 
  
  s.restoreSelections();
}

s.moveCursorToEnd = function(elem){
  // Destroys selections...
  if (window.getSelection && window.getSelection().getRangeAt) { // Good Browsers
    var range = document.createRange();       
    range.selectNodeContents(elem);
    range.collapse(false);          
    window.getSelection().removeAllRanges();     
    window.getSelection().addRange(range)   
  } else if (document.selection && document.selection.createRange) { // IE   
    // Thx http://stackoverflow.com/questions/1125292/how-to-move-cursor-to-end-of-contenteditable-entity
    range = document.body.createTextRange();
    range.moveToElementText(elem);
    range.collapse(false);
    range.select();
  }         
}


// TODO - store and restore window selections so other methods are not destructive
s.storeSelections = function(){}
s.restoreSelections = function(){}


/* 
*  Underline a search term
*/
s.underlineTerm = function($node, term, cls){
    $node.find('.yj-underline').each(function(){
      $(this).replaceWith($(this).text());
    });
    if (!term) return;
    
    var regex = new RegExp('(^|\\s)' + term, 'gi')

    $node.find(cls || 'span').each(function(){
      var $this = $(this)
         , text = $this.text()
         , ind = text.search(regex);

      if (ind > -1){
        if (text.charAt(ind) == ' ')
          ind ++
        
        $this.html("" + text.slice(0, ind) +
          "<span class='yj-underline'>" + 
          yam.escapeXML(text.slice(ind, ind+term.length)) + 
          "</span>" + 
          yam.escapeXML(text.slice(ind + term.length))
        );
      }
    })   
  }  

})
