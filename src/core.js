// Bootstrap the yam namespace -- leaving out the "var" declaration
// to avoid hoisting if the namespace has somehow been declared
// already somewhere else
if (typeof yam == 'undefined') {
  /**
  * @namespace
  * @name yam
  * @description yamjs top level namespace
  */
  yam = {};
}

yam.core = new (function (yam) {
  // Protected/pseudo-privates
  //---------------
  this._handleCounter = 0;  // used in pubsub
  this._subscriptions = {};  // used in pubsub

  // Create a global object we can use both client- and server-side
  if (typeof this.global == 'undefined') {
    this.global = (function () {return this;})();
  }

  // Public methods
  //---------------
  /**
    @name yam.require
    @function
    @description Requires a module as a dependency. Throws an error if the object
    doesn't exist in the runtime.

    @param {String} ns The path the to the module-object.
  */
  this.require = function (ns) {
    var parentObj = this.global;
    var modules = typeof ns == "string" ? ns.split(".") : ns;
    for (var i = 0; i < modules.length; i++) {
      var m = modules[i];
      parentObj = parentObj[m];
      if (!parentObj) {
        throw new Error('Error: ' + ns + ' required for this module.');
      }
    }
    return parentObj;
  }

  /**
    @name yam.val
    @function
    @description Safely retrieves or sets a nested property on an object.

    @param {Object} root The object from which the property is to be retrieved or set.
    @param {String} path The dot notation path to the property.
    @param {Object} [value] If passed, sets the property to that value.
    @example
    var obj = { foo: { bar: 'baz' } };

    // Returns baz
    yam.val(obj, 'foo.bar');

    // Returns undefined but does not throw any errors
    yam.val(obj, 'bing.bong');

    // Sets obj.foo.bar to 'bing'
    yam.val(obj, 'foo.bar', 'bing');

    // Creates and sets obj.baz.bang to 'bar'
    yam.val(obj, 'baz.bang', 'bar');
  */
  this.val = function (root, path, value){
    var prnt = root
      , parts = path.split('.')
      , setting = arguments.length == 3
      , ordlen = parts.length-1;

    for (var i = 0, ii = parts.length; i < ii; i++) {
      var p = parts[i];

      if (!prnt[p]){
        if (!setting){ return prnt[p]; }
        prnt[p] = (i == ordlen) ? value : {};
      } else if (i == ordlen){
        return setting ? prnt[p] = value : prnt[p];
      }
      prnt = prnt[p];
    }
  };

  this.define = yam.define || function (mod, cb) {
    var args    = Array.prototype.slice.call(arguments, 0)
      , cb      = args.pop()
      , modules = typeof args[0] != 'string' ? args[0] : args;

    var GLOBALS = {
        '$' : this.global.jq
      , '_' : yam._
      , 'JSON' : yam.json
      , 'Mustache': yam.global.Mustache
    };

    if (modules){
      for (var i = 0, ii = modules.length; i< ii; i++){
        if (GLOBALS[modules[i]]){
          // TODO - we'll dangle these off yam
          modules[i] = GLOBALS[modules[i]];
        } else{  
          modules[i] = yam.require(modules[i]);
        }  
      }
    }
    
    cb.apply(null, modules || []);
  };

  /**
    @name yam.mixin
    @function
    @description Copy the properties on an object to another object. If
    multiple source objects are passed, properties are copied from left
    to right, meaning same-named properties on later object-params overwrite
    those from earlier ones.

    @param {Object} target The object to copy properties onto.
    @param {Object} source An object to copy properties from.
    @param {Object} [sources...] More objects to copy properties from.
    @param {Boolean} [merge] If set to true, merges object sub-properties
    together instead of just overwriting with those from the source object.
  */
  // yam.mixin(target, source, [source,] [source, etc.] [merge-flag]);
  this.mixin = (function () {
    var _mix = function (targ, src, merge) {
      for (var p in src) {
        // Don't copy stuff from the prototype
        if (src.hasOwnProperty(p)) {
          if (merge &&
              // Assumes the source property is an Object you can
              // actually recurse down into
              (typeof src[p] == 'object') &&
              (src[p] !== null) &&
              !(src[p] instanceof Array)) {
            // Create the source property if it doesn't exist
            // TODO: What if it's something weird like a String or Number?
            if (typeof targ[p] == 'undefined') {
              targ[p] = {};
            }
            _mix(targ[p], src[p], merge); // Recurse
          }
          // If it's not a merge-copy, just set and forget
          else {
            targ[p] = src[p];
          }
        }
      }
    };

    return function () {
      var args = Array.prototype.slice.apply(arguments),
          merge = false,
          targ, sources;
      if (args.length > 2) {
        if (typeof args[args.length - 1] == 'boolean') {
          merge = args.pop();
        }
      }
      targ = args.shift();
      sources = args;
      for (var i = 0, ii = sources.length; i < ii; i++) {
        _mix(targ, sources[i], merge);
      }
      return targ;
    };
  }).call(this);

  /**
    @name yam.ns
    @function
    @description Creates a namespace-object.

    @param {String} ns The string representing the namespace to create.
    @param {Object} [obj] An object to mix in to the created namespace
    object.
    @returns {Object} The namespace object
    @example
    yam.ns("foo.bar.baz");
    foo.bar.baz.staticFunction = function () {};
  */
  this.ns = function (ns, obj) {
    if (!ns) {
      throw new Error('yam.ns requires at least one parameter');
    }
    var parentObj = this.global;
    var modules = typeof ns == "string" ? ns.split(".") : ns;
    for (var i = 0; i < modules.length; i++) {
      var m = modules[i];
      if (!parentObj[m]) {
        parentObj[m] = {};
      }
      parentObj = parentObj[m];
    }
    if (obj) {
      this.mixin(parentObj, obj);
    }
    return parentObj;
  };


  this.ctor = (function () {
    var _mixin = function (obj, mixins) {
          return yam.mixin.apply(yam, [obj].concat(mixins));
       }
      , _isArray = function (obj) {
          return obj &&
            typeof obj === 'object' &&
            typeof obj.length === 'number' &&
            typeof obj.splice === 'function' &&
            !(obj.propertyIsEnumerable('length'));
        };

    return function () {
      var declaredClass = null, base = null, mixins = [], definition = null;

      var len = arguments.length;
      if (len < 2) {
        throw new Error('yam.ctor: ArgumentError: invalid argument combination');
        // class, definition
      } else if (len == 2) {
        declaredClass = arguments[0];
        definition = arguments[1];
        // class, base|mixins, definition
      } else if (len == 3) {
        declaredClass = arguments[0];
        definition    = arguments[2];
        if (_isArray(arguments[1])) {
          mixins = arguments[1];
        } else {
          base = arguments[1];
        }
        // class, base, mixin, definition
      } else if (len == 4) {
        declaredClass = arguments[0];
        base          = arguments[1];
        mixins        = arguments[2];
        definition    = arguments[3];
      } else {
        throw new Error('yam.ctor: ArgumentError: invalid argument combination');
      }

      var moduleName = declaredClass.split('.')
        , ns         = yam.ns(moduleName.slice(0, -1));

      definition.init = definition.init || (base && base.prototype.init) || function () {};

      var ctor = function () {
        this.init.apply(this, arguments);
      };

      var composition = mixins.concat([definition]);

      // Replace subclass methods that have an ancestor
      if (!base) {
        _mixin(ctor.prototype, composition);
      } else {
        // Introduce this._super to the sub classed method
        ctor = function () {
          this._super = base;
          this.init.apply(this, arguments);
          this._super = null;
        };

        var proto = ctor.prototype;
        _mixin(proto, composition);

        var createMethodWithSuper = function (prop, func) {
          return function () {
            this._super = base.prototype[prop];
            var ret = func.apply(this, arguments);
            this._super = null;
            return ret;
          };
        };

        for (var prop in base.prototype) {
          if (!base.prototype.hasOwnProperty(prop)) { continue; }

          // If the property exists on the subclass
          if (proto[prop]) {
            // If the function exists on the base class then introduce this._super
            if (typeof proto[prop] === 'function') {
              proto[prop] = createMethodWithSuper(prop, proto[prop]);
            }

          // Just add the base class function to the subclass
          } else {
            proto[prop] = base.prototype[prop];
          }
        }
      }

      ns[moduleName[moduleName.length-1]] = ctor;
      ctor.prototype.declaredClass = declaredClass;
      return ctor;
    };
  }).call(this);

  /*
   * pubsub functions
   */
  this.publish = function (topic, args) {
    var s = this._subscriptions;

    if (!s[topic]) { return; }
    for (var id in s[topic]) {
      var fn = s[topic][id];
      fn.apply(fn, args || []);
    }
  };

  this.subscribe = function (topic, fn) {
    var self = this;
    if (this.isArray(topic)) {
      var topics = [];
      yam._.each(topic, function (x) {
        topics.push(self.subscribe(x, fn));
      });
      return topics;
    }

    var id = this._handleCounter, s = this._subscriptions;

    if (!s[topic]) { s[topic] = {}; }
    s[topic][id] = fn;
    this._handleCounter++;

    return [topic, id];
  };

  this.unsubscribe = function (handle) {
    var topic = handle[0], id = handle[1];
    var s = this._subscriptions;

    if (s[topic] && s[topic][id]) {
      s[topic][id] = null;
      delete s[topic][id];
    }
  };

  this.unsubscribeAll = function () {
    var s = this._subscriptions;
    for (var topic in s) {
      for (var id in s[topic]) {
        this.unsubscribe([topic, id]);
      }
    }
  };

  this.bind = function (scope, func) {
    var fn = typeof func == "string" ? scope[func] : func;
    return function () {
      return fn.apply(scope, arguments);
    };
  };

  this.curry = function () {
    var self = this
      , scope = arguments[0]
      , func = arguments[1]
      , curried = Array.prototype.slice.call(arguments, 2);
    return function () {
      var f = self.bind(scope, func);
      var args = curried.concat(Array.prototype.slice.call(arguments, 0));
      return f.apply(scope, args);
    };
  };

  /**
    @name yam.hook
    @function
    @description Connects target.targetFunc(...) to src.srcFunc(...)
        with AOP after-advice

    @param {Object|null} [src] Source object
    @param {String} srcFunc Method name
    @param {Object|null} [target] Target object
    @param {String|Function} targetFunc Method name or function

    @returns {Object} The connection handle that can be disconnected with
        yam.unhook(handle)
  */
  this.hook = (function () {
    var self = this;
    var throwArgumentError = function (msg) {
      throw new Error('yam.hook: ArgumentError: ' + msg);
    };

    var throwBindError = function () {
      var args = Array.prototype.slice.call(arguments, 0);
      var msg = args.splice(0, 1);
      throw new Error('yam.hook: BindError: ' + msg + ': arguments:  ' + args.join(', '));
    };

    // Assumes that targetFunc is a string.  This creates an executor
    // that locates the targetFunc when the source function is executed.
    // This means that targetFunc does not have to exist on the target
    // at the time that the hook is created.
    var createLateBindingExecutor = function (target, targetScope, targetFunc) {
      return function () {
        // Locate target.  This is different than targetScope because
        // target refers to where the targetFunc might live in the
        // scope chain.  targetScope refers to what scope the function will
        // execute in.  It's possible that the targetFunc will live in
        // yam.global but will execute in the scope of src.  This holds true
        // for global DOM event handlers.
        var func = target ? target[targetFunc] : self.global[targetFunc];
        if (!func) {
          throwBindError('could not bind to target function'
            , target
            , targetScope
            , targetFunc);
        }
        return func.apply(targetScope, arguments);
      };
    };

    // Assumes targetFunc is a function and returns an early bound executor.
    var createEarlyBindingExecutor = function (target, targetScope, targetFunc) {
      return self.bind(targetScope, targetFunc);
    };


    // Intelligently binds targetFunc
    var createExecutor = function (target, targetScope, targetFunc) {
      switch (typeof targetFunc) {
        case 'function':
          return createEarlyBindingExecutor(target, targetScope, targetFunc);
        case 'string':
          return createLateBindingExecutor(target, targetScope, targetFunc);
        default:
          throwArgumentError('targetFunc must be a function or a string: ' + targetFunc);
      }
    };

    // Append to handler to a proxy
    var appendExecutor = function (proxy, executor) {
      var id = self._handleCounter++
        , hooks = proxy.__h.hooks
        , positions = proxy.__h.positions;

      hooks.push(executor);
      positions[id] = hooks.length - 1;
      return [proxy, id];
    };

    // Creates a hook handle
    var createHandle = function (proxy, customData) {
      var id = self._handleCounter++;
      return [proxy, id, customData];
    };

    // Creates a function proxy that replaces the original src function
    var createProxy = function (src, srcFunc) {
      // Locate the original function on the source
      var orig = src[srcFunc];
      var h = { positions: {}, hooks: [] };

      // Proxy is the function that replaces the original function
      // on the source.
      var proxy = function () {

        // Call original function
        var ret = orig.apply(this, arguments);

        // Call all functions that are hooked to the original function.
        var hooks = h.hooks.concat();
        for (var i = 0; i < hooks.length; ++i) {
          hooks[i].apply(this, arguments);
        }

        // Return the original functions return value
        return ret;
      };
      proxy.__h = h;
      src[srcFunc] = proxy;
      return proxy;
    };

    // Finds a function proxy or defers to yam.hook.findCustomProxy
    var findProxy = function (src, srcFunc) {
      var func = src && src[srcFunc];
      if (func && func.__h) { return func; }
      return false;
    };

    // BEGIN: Actual hook function
    return function () {
      var src       // Source object. May be null.
      , srcFunc     // Source event.  Must be a string.
      , target      // Target object. May be null.
      , targetFunc; // Target function. // May be a string or a function.

      // Args parsing
      switch (arguments.length) {
        case 2:
          srcFunc    = arguments[0];
          targetFunc = arguments[1];
          break;

        case 3:
          src        = arguments[0];
          srcFunc    = arguments[1];
          targetFunc = arguments[2];
          break;

        case 4:
          src        = arguments[0];
          srcFunc    = arguments[1];
          target     = arguments[2];
          targetFunc = arguments[3];
          break;

        default:
          throwArgumentError('invalid argument combination');
      }

      // Resolve target scope which may be different than target in
      // the event of a global DOM handler.
      var targetScope = target || src || yam.global
        , srcScope    = src    || yam.global
        , handle;

      // Test for a custom event and if needed defer hook creation to the adapter.
      if (self.hook.isCustomEvent(srcScope, srcFunc)) {
        var customData = self.hook.hookCustomEvent(srcScope, srcFunc, target, targetScope, targetFunc);
        handle = createHandle(null, customData);

      // Create a standard hook
      } else {
        // Returns an early or late bound executor
        var executor = createExecutor(target, targetScope, targetFunc);

        var proxy = findProxy(src, srcFunc);
        if (proxy) {
          handle = appendExecutor(proxy, executor);
        } else {
          proxy    = createProxy(srcScope, srcFunc);
          handle   = appendExecutor(proxy, executor);
        }
      }

      return handle;
    };
    // END: Actual hook function
  }).call(this);

  // Override this method in jquery adapter if you want hook to handle
  // custom events
  this.hook.isCustomEvent = function (src, evt) {
    return false;
  };

  // Override this method in jquery adapter if you want hook to handle
  // custom events
  this.hook.hookCustomEvent = function (srcScope, evt) {
    throw new Error('yam.hook.hookCustomEvent: not implemented');
  };

  // Override this method in jquery adapter if you want hook to handle
  // custom events
  this.hook.unhookCustomEvent = function (handle) {
    throw new Error('yam.hook.unhookCustomEvent: not implemented');
  };

  /**
    @name yam.hookOnce
    @function
    @description Hooks a source event/function once and then unhooks the
        the source event/function immediately following execution.

    @param {Object|null} [src] Source object
    @param {String} srcFunc Method name
    @param {Object|null} [target] Target object
    @param {String|Function} targetFunc Method name or function

    @returns {Object} The connection handle
   */
  this.hookOnce = function (src, evt, target, targetFunc) {
    var self = this
      , h
      , funcIndex = target && targetFunc ? 3 : 2
      , args = Array.prototype.slice.call(arguments, 0);

    // Get original function
    var fnOrString = args[funcIndex];

    args[funcIndex] = function () {
      self.unhook(h);
      // this should be the correct scope as determined by yam.hook
      self.bind(this, fnOrString).apply(this, arguments);
    };

    // Delegate variable argument parsing to hook
    h = this.hook.apply(this, args);
    return h;
  };

  /**
    @name yam.unhook
    @function
    @description Unhooks a source event/function connected by yam.hook
        from its target.

    @param {Array} Hook-handle, array of data which points to original
        hook-connection
   */
  this.unhook = function (handle) {
    if (!handle){ return; }

    var proxy = handle[0], id = handle[1], customData = handle[2];

    if (customData) {
      this.hook.unhookCustomEvent(id, customData);
    } else {
      var __h = proxy.__h
        , positions = __h.positions
        , hooks = __h.hooks
        , position = positions[id];

      // Guard against multiple unhook operations on the same handle.
      // position should be a non-negative number -- isNaN(null) => false,
      // so just make sure we have a truthy value or explicit zero
      if (!(position || position === 0)) { return; }

      hooks.splice(position, 1);
      delete positions[id];

      for (var p in positions) {
        if (positions[p] > position) {
          positions[p]--;
        }
      }
    }
  };

  /**
    @name yam.objectify
    @function
    @description Convert the values in a query string (key=val&key=val) to
    an Object
    @param {String} str A querystring
    @param {Object} [opts] Options
      @param {Boolean=true} [options.consolidate] convert mutliple instances of
          the same key into an array of values instead of overwriting.
    @returns JavaScript key/val object with the values from
        the querystring
  */
  this.objectify = function (str, options) {
    var opts = options || {};
    var d = {};
    var consolidate = typeof opts.consolidate == 'undefined' ?
        true : opts.consolidate;
    if (str) {
      var arr = str.split('&');
      for (var i = 0; i < arr.length; i++) {
        var pair = arr[i].split('=');
        var name = pair[0];
        var val = decodeURIComponent(pair[1] || '');
        // "We've already got one!" -- arrayize if the flag
        // is set
        if (typeof d[name] != 'undefined' && consolidate) {
          if (typeof d[name] == 'string') {
            d[name] = [d[name]];
          }
          d[name].push(val);
        }
        // Otherwise just set the value
        else {
          d[name] = val;
        }
      }
    }
    return d;
  };

  /**
    @name yam.paramify
    @function
    @description Converts a JS Object to querystring (key=val&key=val).
    Value in arrays will be added as multiple parameters.

    @param {Object} obj Object containing only scalars and arrays
    @param {Object} [options] JS object of options for how to format
    the return string.
      @param {Boolean=false} [options.consolidate] Take values from elements
          that can return multiple values (multi-select, checkbox groups)
          and collapse into a single, comman-delimited value. (e.g.,
          thisVar=asdf,qwer,zxcv).
      @param {Boolean=False} [options.includeEmpty] Include keys in the
          string for all elements, even if they have no value set (e.g.,
          even if elemB has no value: elemA=foo&elemB=&elemC=bar).
          Note that some false-y values are always valid even without this
          option, [0, '']. This option extends coverage to [null, undefined, NaN]
      @param {Boolean=false} [options.snakeize] Change param names from
          camelCase to snake_case.
      @param {Boolean=false} [options.escapeVals] Escape the values for XML entities.

    @returns A querystring containing the values in the Object
   */
  this.paramify = function (obj, o) {
    var opts = o || {},
        str = '',
        key,
        val,
        isValid,
        itemArray,
        arr = [],
        arrVal;

    for (var p in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, p)) {
        val = obj[p];

        // This keeps valid falsy values like false and 0
        // It's duplicated in the array block below. Could
        // put it in a function but don't want the overhead
        isValid = !( val === null || val === undefined ||
                    (typeof val === 'number' && isNaN(val)) );

        key = opts.snakeize ? yam.snakeize(p) : p;
        if (isValid) {
          // Multiple vals -- array
          if (this.isArray(val) && val.length) {
            itemArray = [];
            for (var i = 0, ii = val.length; i < ii; i++) {
              arrVal = val[i];
              // This keeps valid falsy values like false and 0
              isValid = !( arrVal === null || arrVal === undefined ||
                           (typeof arrVal === 'number' && isNaN(arrVal)) );

              itemArray[i] = isValid ? encodeURIComponent(arrVal) : '';
              if (opts.escapeVals) {
                itemArray[i] = yam.escapeXML(itemArray[i]);
              }
            }
            // Consolidation mode -- single value joined on comma
            if (opts.consolidate) {
              arr.push(key + '=' + itemArray.join(','));
            }
            // Normal mode -- multiple, same-named params with each val
            else {
              // {foo: [1, 2, 3]} => 'foo=1&foo=2&foo=3'
              // Add into results array, as this just ends up getting
              // joined on ampersand at the end anyhow
              arr.push(key + '=' + itemArray.join('&' + key + '='));
            }
          }
          // Single val -- string
          else {
            if (opts.escapeVals) {
              val = yam.escapeXML(val);
            }
            arr.push(key + '=' + encodeURIComponent(val));
          }
          str += '&';
        }
        else {
          if (opts.includeEmpty) { arr.push(key + '='); }
        }
      }
    }
    return arr.join('&');
  };

  /**
    @name yam.isArray
    @function
    @description Crockfordian array-test, use instead of instanceof
        because instanceof fails across window-boundaries.

    @param {*} obj Item which might be an array.
   */
  this.isArray = function (obj) {
    return obj &&
      typeof obj === 'object' &&
      typeof obj.length === 'number' &&
      typeof obj.splice === 'function' &&
      !(obj.propertyIsEnumerable('length'));
  };

  /**
    @name yam.log
    @function
    @description Wrapper for console.log, silent unless yam.config.debug is
        flipped on. yam.config.debugModules can be set (comma-separated list)
        to allow filtering of this logging by log-string prefix (e.g., if
        yam.config.debugModules is set to 'foo,bar', only log-strings prefix
        with 'foo' or 'bar' will be displayed.

    @param {*} [args...] Items to log.
   */
  this.log = (function () {
    // If there's a real console, log to it in debug-mode only
    if (typeof console != 'undefined' && typeof console.log == 'function') {
      return function () {
        var args
          , time
          , config = typeof yam.config == 'function' ? yam.config() : {}
          , modules;

        // look in yam.config for modules to scope logs to
        modules = config.debugModules;
        modules = modules && modules.split(',');

        if (config.debug || modules) {

          // don't log if modules is set and the first param of this log is not one of them
          var part = arguments[0]
            , matched;

          if (typeof part == 'string') {
            matched = _.detect(modules, function (module){ return part.indexOf(module) != -1; });
          }
          else {
            console.log('First arg to yam.log must be a string so we can do module-filtering.');
            console.log(part);
          }

          if (modules && !matched) { return; }

          args = Array.prototype.slice.call(arguments);
          time = yam.clock.now().toString();
          args.push(time);
          console.log.apply(console, args);
        }
      };
    }
    // Fall back to no-op in environments with no console
    return function () {};
  }).call(this);

  // TODO - delegate to console.warn if available
  this.warn = function(){
    var args = Array.prototype.slice.call(arguments, 0)
    args.unshift('YJ Warning:')
    yam.log.apply(this, args)
  }

  /**
   * Show deprecation messages
   */
  this.deprecate = function (objOrStr, method, message) {
    return;
    var className = typeof objOrStr == 'string' ? objOrStr : objOrStr.declaredClass
      , msg = 'deprecation warning for ' + className + '.' + method;
    if (message) { msg += ': ' + message; }
    this.log(msg);
  };

  /**
   * Show experimental messages
   */
  this.experimental = function (objOrStr, method, message) {
    var className = typeof objOrStr == 'string' ? objOrStr : objOrStr.declaredClass
      , msg = className + '.' + method + ' is experimental and subject to change';
    if (message) { msg += ': ' + message; }
    this.log(msg);
  }

  /*
   * global functions - this helps make yamjs more testable
   */
  this.random = Math.random;

  this.clock = {
    now: function () { return new Date(); }
  };

  this.setTimeout = function () {
    return this.global.setTimeout(arguments[0], arguments[1]);
  };

  this.setInterval = function () {
    return this.global.setInterval(arguments[0], arguments[1]);
  };

  this.clearTimeout = function () {
    this.global.clearTimeout(arguments[0]);
  };

  this.clearInterval = function () {
    this.global.clearInterval(arguments[0]);
  };

  // ---------------------------
  // Mix all these method onto the global yam namespace
  // ---------------------------
  this.mixin(yam, this);

})(yam);
