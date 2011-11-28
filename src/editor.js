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
    

---- Rough ideas: ---    
    
Set the transform for normalisation:
  
    e.transforms = function(){
      return {
      //   MODE  : HTML
          'bold' : '<strong />'
        , 'link' : '<span class="mock-link" />'
        , 'italic' : function(text){return to_html(text)}
      }
    }

Or: 

    e.normalize = function(html){
      return my_normalize(html)
    }


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

yam.define(['$', '_'], function($,_){
  
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
      this.$elem = $(args[0])
      
    } else{
      throw "Not implemented 0 args yet"
    }
    
    // Setup element
    this.$elem[0].contentEditable = "true"
    
  }
  
  /*
  */
  e.html = function(){}
  
  /*
  */
  e.text = e.val = function(){}
  
  /*
  */
  e.appendTo = function(){}
  
  /*
  */
  e.bind = function(){
    return this.$.bind.apply(this.$, arguments)
  }
  
  e.focus = function(){}
  e.append = function(){}
  
})