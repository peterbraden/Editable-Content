yam.define(['$', '_', 'yam.dom', 'yam.Editor'], function($,_, dom, Editor){


var capabilities = {}

capabilities.bold = function(editor){
 editor.execCommand('bold') 
}

capabilities.italic = function(editor){
 editor.execCommand('italic') 
}

capabilities.insertorderedlist = function(editor){
 editor.execCommand('insertorderedlist') 
}

capabilities.insertunorderedlist = function(editor){
 editor.execCommand('insertunorderedlist') 
}

capabilities.createlink = function(editor){
  
 editor.execCommand('createlink', undefined, prompt("Enter the url to link to", 'http://yammer.com')) 
}

var defaults = {
  capabilities : capabilities
}

yam.RichEditorMenu = function(editor, settings){
  var self = this
  
  self.settings = yam.mixin({}, settings, defaults)
  self.editor = editor
  
  this.$ = $("<div class='yj-rich-editor-menu' />")
  editor.$elem.before(this.$)
  
  this.$.width(editor.outerWidth())
  
  _.each(self.settings.capabilities, function(v, k){
    self.addCapability(k, v)
  })
  
}

var r = yam.RichEditorMenu.prototype;
yam.RichEditorMenu.CAPABILITIES = capabilities


r.addCapability = function(capability, handler){
  var self = this
    , button = $('<a href = "#" class = "yj-rich-editor-capability yj-rich-editor-' + 
      capability + '">' + capability + '</a>')
 
  this.$.append(button)
 
  button.click(function(){
    handler(self.editor)   
  })    
}







});