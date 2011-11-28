/**
Tools for working with selections and ranges, including getting caret positions etc.

https://developer.mozilla.org/en/DOM/range
http://www.quirksmode.org/dom/range_intro.html


*/
yam.define(['$'], function($){
  /**
  *  Internal: Set the caret position in an input, or textarea
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
  *  Internal: Get the caret position in an input, or textarea
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
       // prevents FF error: uncaught exception: 
       // [Exception... "Component returned failure code: 0x80004005 (NS_ERROR_FAILURE) [nsIDOMNSHTMLTextAreaElement.selectionStart]" nsresult: "0x80004005 (NS_ERROR_FAILURE)" 
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
      var sel = window.getSelection().getRangeAt(0);
      sel.setEnd(sel.startContainer, sel.startOffset)
      
      // this little ninja bit of jquery means that we are setting the start of the range to 
      // the first child of the contenteditable, which is usually a text node
      var sc = sel.startContainer
      sc = (sc.nodeType == 3) ? sc.parentNode : sc // Make sure sc is not text node
      sel.setStart($(sc).parents().add(sc).filter('[contenteditable="true"], [contenteditable="plaintext-only"]')[0].firstChild, 0) 
      var range = sel.cloneContents()
      
      return $(range).text().length 
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
  
  
  
  var s = yam.selection = {
    
    // Current Selection start node
    // Note - can be a text node!  
    currentElement: function(){
      if (document.selection) { // IE
        var range = document.selection.createRange()
        range.collapse(true)
        return range.parentElement();
      } else if (window.getSelection && window.getSelection().getRangeAt) { // Good Browsers
        var container = window.getSelection().getRangeAt(0).startContainer
        return container.nodeType === 3 ? container.parentNode : container;
      } 
    }
    
    /*
    *  get or set caret position in an input, textarea or contenteditable div
    *  @param {element / $element} elem The container with the cursor in - note, 
    *                             if the cursor is not in the container, behaviour is undefined
    *  @param {int} [pos] The position to set the caret.
    */ 
  , caretPos: function(elem, _pos){
      elem = elem || s.currentElement();
      
      if (_pos){
        return $(elem).is('input, textarea') ? _setCaretPosInput(elem, _pos) : _setCaretPosContentEditable(elem, _pos)
      }
      return $(elem).is('input, textarea') ? _getCaretPosInput(elem) : _getCaretPosContentEditable(elem)
    }  
    
    /*
     * Move Caret to end of text 
     *
     * Destroys selections...
     */
    , moveCaretToEnd: function(elem){
      s.caretPos(elem, $(elem)[$(elem).is('textarea, input')?'val' : 'text']().length)  
    }
    
    
    /*
    *  Get coords of caret
    */
    , caretCoords: function(elem){
      s.storeSelections()
      
      $('.yj-ghost').remove();
      var phantom = "<span class='yj-ghost'>I</span>"
        , cpos = s.caretPos(elem)
        , $phantom, pos
      
      s.replaceTextSubstr(cpos, cpos, phantom)
      $phantom = $('.yj-ghost')
      pos = $phantom.position()
      pos.height = $phantom.height() 
      $phantom.remove()
      
      return pos
    }
    
    /*
    *  Careful! : range here is browser specific.
    *  TODO - this should really be an internal method
    */ 
    , replaceRange: function(range, html){
      if (window.getSelection && window.getSelection().getRangeAt) { // Good Browsers
        var node = range.createContextualFragment(html);
        range.deleteContents();
        range.insertNode(node);
      } else if (document.selection && document.selection.createRange) { // IE
        range.pasteHTML(html)
      }  
    }
    
    
    , replaceTextSubstr: function(elem, startindex, endindex, html){
      
      if ($(elem).is('textarea, input')){
        var $elem = $(elem)
          , nw = $elem.val().split('')
        nw.splice(startindex, endindex-startindex, html)
        return $elem.val(nw.join(''))
      }
      
      var range;
      s.storeSelections();      
      
      // Insert fragment - I bet DOJO has a method for this...
      if (window.getSelection && window.getSelection().getRangeAt) { // Good Browsers
        var range = window.getSelection().getRangeAt(0);
        range.setStart(range.startContainer, startindex)
        range.setEnd(range.startContainer, endindex)
      } else if (document.selection && document.selection.createRange) { // IE
        var range = document.selection.createRange()
        range.moveEnd('character', endindex);
        range.moveStart('character', startindex);
      } 
      
      s.replaceRange(range, html) 
      
      s.restoreSelections();
    }
    

    
    
    // TODO - store and restore window selections so other methods are not destructive
    , storeSelections: function(){}
    , restoreSelections: function(){}
  

    
    /* 
    *  Underline a search term
    */
    , underlineTerm : function($node, term, cls){
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
    
  }
});

