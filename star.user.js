/*
Create Element:
$Rainb.el('div',{'attribute':"value",style:{"color":"red"}},[ (childnodes) ])
becomes:  <div attribute="value" style="color: red;"></div>
Append Element
$Rainb.add(element,elementToAppend)
Get Element By Id
$Rainb.id(id);
Create TextNode
$Rainb.tn(text);
Create a RainbNode (an element wrapper)
$Rainb.node(elem);
You can modify RainbNode attributes and children and it will not affect DOM until you call .render
Parameter is boolean, true for rendering children, false for not rendering children
$Rainb.node.render(boolean);
*/
//This probably proves I've gotten better at programming.
//DOM helper functions.
var genParser = (function(tys, tree, start) {
  var source, index;
  var treeRewrite = tree;
  //Apparently, you don't tokenize and then parse, you do it on the go, but with more specific techniques which people call grammars, oh well, how was I suppesd to know that anyway.
  //reference {type:"type",is:"type"} "hue"
  //repetition {type:"repeat",optional:false,from:1,to:Infinity,contains:{},delimiting:null,multipleDelimeters:null} optional to and from are defaulted, delimiters can be used for lists like a,b,c and stuff
  //array {type:"tyArray",contains:[]}
  //alternate  {type:"alternate",contains:[]}
  //Expression {type:"expression",contains:{},operators:[{precedence:1,rightAssociative:false,tokens:[]}}],delimeters=[["(",")"]],whiteSpaceIgnore:null}
  var mains = { //START PARSE
    type: "type",
    is: start
  }
  //yay extendibility
  var funcs = { //funcions/types used, hue
    expression: function(o) { //parse it like an expression
      //this is probably a little bit hard to understand
      var r = {
          type: "alternate",
          contains: [o.contains]
        }, //is it a token, an operator, or a parenthesis?
        opers = {
          type: "alternate",
          contains: []
        },
        delims = {
          type: "alternate",
          contains: []
        },
        i, I, l, L, props, t, n, ret = {},
        _ind = index,
        EXPRS = [],
        OPERATORS = [],
        O, precedence, rightAssociative, arg1, arg2, k; //I use and reuse most variables I can, damn
      if (O = o.operators) {
        for (i = 0, l = O.length; i < l; i++) {
          for (I = 0, L = O[i].tokens.length; I < L; I++) {
            t = O[i].tokens[I];
            if (o.whiteSpaceIgnore) {
              if (typeof t === "string") {
                opers.contains.push(new RegExp("\\s*(?:" + t.replace(/([-+\\?.!$^&*(){}[\]])/g, "\\$1") + ")\\s*"));
              } else if (t instanceof RegExp) {
                opers.contains.push(new RegExp("\\s*(?:" + t.source + ")\\s*", (t.multiline ? "m" : "") + (t.ignoreCase ? "i" : "")))
              } else {
                opers.contains.push({
                  type: "tyArray",
                  contains: [/\s*/, t, /\s*/]
                }); /*Ahh I HATE THIS! D:*/
              }
            } else {
              opers.contains.push(t);
            }
          }
        }
        r.contains[1] = opers; //ADD THEM TO THE LIST
      }
      if (O = o.delimeters) { //this is like a carbon copy of the previous if, should I try to make it a function? Don't repeat yourself
        for (i = 0, l = O.length; i < l; i++) {
          for (I = 0, L = O[i].length; I < L; I++) {
            t = O[i][I];
            if (o.whiteSpaceIgnore) {
              if (typeof t === "string") {
                delims.contains.push(new RegExp("\s*(?:" + t + ")\s*"));
              } else if (t instanceof RegExp) {
                delims.contains.push(new RegExp("\s*(?:" + t.source + ")\s*", (t.multiline ? "m" : "") + (t.ignoreCase ? "i" : "")))
              } else {
                delims.contains.push({
                  type: "tyArray",
                  contains: [/\s*/, t, /\s*/]
                }); /*Ahh I HATE THIS! D:*/
              }
            } else {
              delims.contains.push(t);
            }
          }
        }
        r.contains[2] = delims;
      }
      /*Shunting Yard Algorithm*/
      while (n = isIndexItem(r, props = {})) { //While there are tokens to be read
        //read a token
        if (props._matched === r.contains[0]) { //If the token is a number, then add it to the output queue.
          EXPRS.push(n);
        } else
        if (props._matched === opers) { //If the token is an operator, o1, then
          if ((I = opers.contains.indexOf(props.props._matched)) !== -1) {
            for (i = 0, l = (O = o.operators).length, k = 0; i < l; i++) { //
              if ((k += O[i].tokens.length) > I) {
                precedence = O[i].precedence;
                rightAssociative = O[i].rightAssociative;
                break;
              }
            }
          } else {
            throw new Error("props.props._matched not found at oper.contains, This is impossible.. or is it?");
          }
          while ((L = OPERATORS.length) && (((!rightAssociative) && precedence === OPERATORS[L - 1][1]) || precedence < OPERATORS[L - 1][1])) { //while there is an operator token, o2, at the top of the stack, and
            //either o1 is left-associative and its precedence is equal to that of o2,
            //or o1 has precedence less than that of o2,
            /*POPPINGG!!*/
            //pop o2 off the stack, onto the output queue;
            //This popping is also a bit of PRN execution, basically it is shunting yard and prn, or something weird
            arg2 = EXPRS.pop();
            arg1 = EXPRS.pop();
            if (!(EXPRS.length || arg1)) {
              console.warn("NOT ENOUGH TERMS");
            }
            t = OPERATORS.pop();
            for (i = 0, l = (O = o.operators).length, k = 0; i < l; i++) {
              if ((k += O[i].tokens.length) > t[2]) {
                EXPRS.push({
                  operation: O[i].tokens[t[2] - (k - O[i].tokens.length)],
                  op: t[0],
                  arguments: [arg1, arg2],
                  name: "operator"
                });
                break;
              }
            }
          }
          OPERATORS.push([n, precedence, I]);
        } else
        if (props._match === delims) {} else {
          throw Error("This is impossible! It has matched an unknown value..???");
        }
      }
      //When there are no more tokens to read
      while (L = OPERATORS.length) { //While there are still operator tokens in the stack
        //Pop the operator onto the output queue.
        arg2 = EXPRS.pop();
        arg1 = EXPRS.pop();
        if (!(EXPRS.length || arg1)) {
          console.warn("NOT ENOUGH TERMS");
        }
        t = OPERATORS.pop();
        for (i = 0, l = (O = o.operators).length, k = 0; i < l; i++) {
          if ((k += O[i].tokens.length) > t[2]) {
            EXPRS.push({
              operation: O[i].tokens[t[2] - (k - O[i].tokens.length)],
              op: t[0],
              arguments: [arg1, arg2],
              name: "operator"
            });
            break;
          }
        }
      }
      if (EXPRS.length < 1) {
        return null;
      }
      if (EXPRS.length !== 1) {
        throw new Error("Operators and expressions mismatch!!");
      }
      return EXPRS[0];
    },
    type: function(o) { //get type and parse it
      var props = {},
        a = isIndexItem(tys[o.is], props),
        t, ret; //this is where props originally started, in short words, it is used to pass properties from other functions to here 
      if (a === null) return null;
      //console.log()
      ret = {
        type: (t = tys[o.is]) && (t.delimiting ? "list" : t.type || ((typeof t === "string" || t instanceof RegExp) ? "String" : undefined)),
        name: o.is,
        content: a
      }
      for (var k in props) {
        if (props.hasOwnProperty(k) && (!ret[k])) {
          ret[k] = props[k];
        }
      }
      return ret;
    },
    repeat: function(o, props) { //repeat
      var reto = [],
        e, d, _ind = index,
        l, p, D = o.delimiting,
        i = 0,
        p = D && o.multipleDelimeters, //say, if the delimeter is just once, there is no point in putting it each time it appears.. right? so an CSV like "abc,dfe,ege" will appear as ["abc","dfe","ege"] instead of ["abc",',',"dfe",',',"ege"]
        props2;
      d = o.contains;
      props.props = [];
      do {
        e = isIndexItem(D ? i & 1 ? D : d : d, props2 = {});
        if ((!p) && D && i & 1) {
          i++;
          if (e !== null) {
            continue;
          } else {
            break;
          }
        }
        i++;
        if (e !== null) {
          reto.push(e)
          props.props.push(props2)
        }
      } while (e !== null && i !== o.to);
      l = reto.length;
      if (((!o.optional) && l == 0) || ((!isNaN(p = o.from)) && l < p)) {
        index = _ind;
        return null;
      }
      if (D && !p) {
        props.delimeter = D
      }
      return reto;
    },
    tyArray: function(o, props) { //tokens are in some order
      var reto = [],
        e, _ind = index,
        opt = o.optional || [],
        props2;
      props.props = [];
      for (var i = 0, l = o.contains.length, d; i < l; i++) {
        d = o.contains[i];
        e = isIndexItem(d, props2 = {});
        if (e === null && (opt.indexOf(i) < 0)) {
          index = _ind;
          return null;
        }
        if (e !== null) props.props.push(props2);
        reto.push(e);
      }
      return reto;
    },
    alternate: function(o, props) { //It alternates 
      var reto = null,
        e, props2 = {};
      for (var i = 0, l = o.contains.length, d; i < l; i++) {
        d = o.contains[i];
        e = isIndexItem(d, props2);
        if (e !== null) {
          reto = e;
          props.props = props2;
          props._matched = d;
          break;
        }
      }
      return reto;
    }
  }

  function isIndexItem(item, props) { //recursive
    //returns item or null
    var s, t, r,
      f;
    if (!item) {
      return null
    } else
    if (item instanceof RegExp) {
      r = new RegExp
      r.compile("^(?:" + item.source + ")", (item.multiline ? "m" : "") + (item.eturnignoreCase ? "i" : ""))
      //r.lastIndex = index;
      s = r.exec(source.substr(index)); //RAAAWR damn it
      t = s && s[0];
      if (t === null) return null;
      index += t.length;
      return t;
    } else if (typeof item == "string") { //literal match
      //console.log("DOES "+item+" and"+source.substr(index,item.length)+" MATCHES??");
      if (item === source.substr(index, item.length)) return (index += item.length), item;
      return null;
    } else {
      t = item.type;
      f = funcs[t];
      s = f(item, props);
      if (f) return s;
      else return null;
    }
  }

  function Parser(arg) {
    source = arg,
      index = 0; //index is 0!!!
    return treeRewrite.unknown(isIndexItem(mains)); //wasn't that just pretty understandable?
  }
  return Parser;
});
var CssSelectorParser = genParser({ //tys, meaning types
  "type selector": /\*|(?:[\w_]|\\x?[a-f0-9]{2,6}\s?|\\[\S\s])(?:[^\\\s#.>&+~:,="'[\]\)]|\\x?[a-f0-9]{2,6}\s?|\\[\S\s])*/i, //regex for tagname
  attributeValue: { //the vaue of an attibute, it can be 
    type: "alternate",
    contains: [/"(?:[^"\\]|\\[\s\S])*"|'(?:[^'\\]|\\[\s\S])*'/i, {
      type: "type",
      is: "type selector"
    }]
  },
  "pseudo-class": {
    type: "alternate",
    contains: [{
      type: "tyArray",
      contains: [":not", {
        type: "tyArray",
        contains: ["(", {
          type: "type",
          is: "selectorArray"
        }, ")"]
      }],
    }, {
      type: "tyArray",
      contains: [/::?(?:[\w_]|\\x?[a-f0-9]{2,6}\s?|\\[\S\s])(?:[^\\\s#.>&+~:,(]|\\x?[a-f0-9]{2,6}\s?|\\[\S\s])*/, {
        type: "tyArray",
        contains: ["(", /(?:[^)\\]|\\[\S\s])*/, ")"]
      }],
      optional: [1]
    }]
  }, //is for this I was thinking of implementing my own regex, this is beyond ridiculous
  operator: /\s*(?:\$=|\^=|~=|\|=|\*=|=)\s*/, //you know the thing at [attr=value]
  "attribute selector": {
    type: "tyArray",
    contains: ['[', {
      type: "tyArray",
      contains: [{
        type: "type",
        is: "type selector"
      }, {
        type: "type",
        is: "operator"
      }, {
        type: "type",
        is: "attributeValue"
      }],
      optional: [1, 2]
    }, ']']
  },
  "ID selector": {
    type: "tyArray",
    contains: ['#', { //an id starts with an #
      type: "type",
      is: "type selector"
    }]
  },
  "class selector": { //a classname starts with a dot
    type: "tyArray",
    contains: ['.', {
      type: "type",
      is: "type selector"
    }]
  },
  "simple selector": { //a element selector is composed from tagname, clasname,attributesm, and pseudoclasses
    //this is a sequence of simple selectors
    type: "repeat",
    contains: {
      type: "alternate",
      contains: [{
        type: "type",
        is: "type selector"
      }, {
        type: "type",
        is: "class selector"
      }, {
        type: "type",
        is: "ID selector"
      }, {
        type: "type",
        is: "attribute selector"
      }, {
        type: "type",
        is: "pseudo-class"
      }]
    }
  },
  selector:
  /* {OLD LOL
  	type: "repeat",
  	delimiting: {
  		type: "type",
  		is: "relationship"
  	},
  	contains: {
  		type: "type",
  		is: "element"
  	}*/
  {
    type: "expression",
    contains: {
      type: "type",
      is: "simple selector"
    },
    whiteSpaceIgnore: true,
    rightAssociative: true,
    operators: [{
      precedence: 1,
      tokens: ['>', '&', '+', '~', /\s/] //these are not actually operators this are combinators
    }]
  },
  selectorArray: { //this is a selector group
    type: "repeat",
    delimiting: /\s*,\s*/, //it is separated by a comma, and optionally whitespace
    contains: {
      type: "type",
      is: "selector"
    }
  }
}, {
  unknown: function(a) {
    return a.name ? this[a.name](a) : a;
  },
  selectorArray: function(a) {
    var b = {
      name: "selector group",
      list: []
    };
    for (var i = 0, l = a.content.length; i < l; i++) b.list.push(this.unknown(a.content[i]))
    return b
  },
  selector: function(a) {
    return this.unknown(a.content)
  },
  "simple selector": function(a) {
    var b = {},
      att, c;
    b.class = [];
    b.attributes = [];
    b.pseudoClass = [];
    for (var i = 0, l = a.content.length, d; i < l; i++) {
      d = a.content[i];
      switch (d.name) {
        case "type selector":
          if (!b.tagName) {
            b.tagname = this.unescape(d.content);
          }
          break;
        case "class selector":
          b.class.push(this.unescape(d.content[1].content))
          break;
        case "ID selector":
          if (!b.ID) {
            b.ID = this.unescape(d.content[1].content);
          }
          break;
        case "attribute selector":
          att = {
            attributeName: this.unescape(d.content[1][0].content)
          }
          if (c = d.content[1][1]) {
            att.operator = c.content;
            att.attributeValue = this.unescape(d.content[1][2].content)
          }
          b.attributes.push(att);
          break;
        case "pseudo-class":
          b.pseudoClass.push({
            class: this.unescape(d.content[0]),
            value: d.content[1] && this.unknown(d.content[1][1])
          })
          break;
      }
    }
    return b;
  },
  operator: function(a) {
    var b = this.unknown(a.arguments[1]);
    b.parent = this.unknown(a.arguments[0]);
    b.parentRelationship = a.op;
    return b;
  },
  unescape: function(string) {
    var unescape = [{
      search: /\\([0-9A-fa-f]{1,6} ?)/g,
      replace: {
        f: "hexadecimal",
        for: 1
      }
    }, {
      search: /\\(.)/g,
      replace: {
        for: 1
      }
    }];
    var replacement, string2 = string,
      func;
    if ((string[0] == '"' || string[0] == "'") && (string[0] === string[string.length - 1])) {
      string2 = string.substring(1, string.length - 1)
    }
    for (var i = 0; i < unescape.length; i++) {
      if ((func = unescape[i].replace.f) === undefined) {
        replacement = "$" + unescape[i].replace.for
      } else {
        if (func == "hexadecimal") replacement = function(s) {
          return String.fromCharCode(parseInt(arguments[unescape[i].replace.for], 16))
        }
      }
      string2 = string2.replace(unescape[i].search, replacement)
    }
    return string2;
  }
}, "selectorArray");
$Rainb = {
  d: document.documentElement
}
$Rainb.id = function(id) {
  return document.getElementById(id);
};
$Rainb.ready = function(fc) {
  var cb;
  if (document.readyState !== 'loading') {
    fc();
    return;
  }
  cb = function() {
    $Rainb.off(document, 'DOMContentLoaded', cb);
    return fc();
  };
  return $Rainb.on(document, 'DOMContentLoaded', cb);
};
$Rainb.formData = function(form) {
  var fd, key, val;
  if (form instanceof HTMLFormElement) {
    return new FormData(form);
  }
  fd = new FormData();
  for (key in form) {
    val = form[key];
    if (val) {
      if (typeof val === 'object' && 'newName' in val) {
        fd.append(key, val, val.newName);
      } else {
        fd.append(key, val);
      }
    }
  }
  return fd;
};
$Rainb.extend = function(object, properties) {
  var key, val;
  for (key in properties) {
    val = properties[key];
    object[key] = val;
  }
};
$Rainb.deepCompare = function() {
  var i, l, leftChain, rightChain;

  function compare2Objects(x, y) {
    var p;
    // remember that NaN === NaN returns false
    // and isNaN(undefined) returns true
    if (isNaN(x) && isNaN(y) && typeof x === 'number' && typeof y === 'number') {
      return true;
    }
    // Compare primitives and functions.     
    // Check if both arguments link to the same object.
    // Especially useful on step when comparing prototypes
    if (x === y) {
      return true;
    }
    // Works in case when functions are created in constructor.
    // Comparing dates is a common scenario. Another built-ins?
    // We can even handle functions passed across iframes
    if ((typeof x === 'function' && typeof y === 'function') || (x instanceof Date && y instanceof Date) || (x instanceof RegExp && y instanceof RegExp) || (x instanceof String && y instanceof String) || (x instanceof Number && y instanceof Number)) {
      return x.toString() === y.toString();
    }
    // At last checking prototypes as good a we can
    if (!(x instanceof Object && y instanceof Object)) {
      return false;
    }
    if (x.isPrototypeOf(y) || y.isPrototypeOf(x)) {
      return false;
    }
    if (x.constructor !== y.constructor) {
      return false;
    }
    if (x.prototype !== y.prototype) {
      return false;
    }
    // Check for infinitive linking loops
    if (leftChain.indexOf(x) > -1 || rightChain.indexOf(y) > -1) {
      return false;
    }
    // Quick checking of one object beeing a subset of another.
    // todo: cache the structure of arguments[0] for performance
    for (p in y) {
      if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
        return false;
      } else if (typeof y[p] !== typeof x[p]) {
        return false;
      }
    }
    for (p in x) {
      if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
        return false;
      } else if (typeof y[p] !== typeof x[p]) {
        return false;
      }
      switch (typeof(x[p])) {
        case 'object':
        case 'function':
          leftChain.push(x);
          rightChain.push(y);
          if (!compare2Objects(x[p], y[p])) {
            return false;
          }
          leftChain.pop();
          rightChain.pop();
          break;
        default:
          if (x[p] !== y[p]) {
            return false;
          }
          break;
      }
    }
    return true;
  }
  if (arguments.length < 1) {
    return true; //Die silently? Don't know how to handle such case, please help...
    // throw "Need two or more arguments to compare";
  }
  for (i = 1, l = arguments.length; i < l; i++) {
    leftChain = []; //Todo: this can be cached
    rightChain = [];
    if (!compare2Objects(arguments[0], arguments[i])) {
      return false;
    }
  }
  return true;
}
$Rainb.on = function(el, events, handler) {
  var event, _i, _len, _ref;
  _ref = events.split(' ');
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    event = _ref[_i];
    el.addEventListener(event, handler, false);
  }
};
$Rainb.off = function(el, events, handler) {
  var event, _i, _len, _ref;
  _ref = events.split(' ');
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    event = _ref[_i];
    el.removeEventListener(event, handler, false);
  }
};
$Rainb.el = function(elem, attributes, childnodes, listeners) {
  //listener format: {lstng:"click",cb:callback}
  var e = (elem instanceof Element) ? elem : document.createElement(elem),
    l;
  for (var a in attributes) {
    if (a == "style") {
      for (var d in attributes[a]) {
        e.style[d] = attributes[a][d];
      }
      continue;
    }
    if (a == "__properties") {
      for (d in attributes[a]) {
        e[d] = attributes[a][d];
      }
      continue;
    }
    e.setAttribute(a, attributes[a])
  }
  if (childnodes && (l = childnodes.length)) {
    for (var i = 0, c; i < l; i++) {
      c = childnodes[i];
      if (c.length && typeof c == "string") {
        e.appendChild(document.createTextNode(c));
        continue;
      }
      e.appendChild(c)
    }
  }
  if (listeners && (l = listeners.length)) {
    for (var i = 0, c; i < l; i++) {
      c = listeners[i];
      $Rainb.on(e, c.lstng, c.cb);
    }
  }
  return e;
}
$Rainb.HTTP = function() {
  var lastModified = {};
  return (function(url, extra, callback, headers) {
    //headers is an object like this {Connection:"keep-alive"}
    extra = extra || {};

    function createXMLHttpRequest() {
      if (typeof XMLHttpRequest != "undefined") {
        return new XMLHttpRequest();
      } else if (typeof window.ActiveXObject != "undefined") {
        try {
          return new ActiveXObject("Msxml2.XMLHTTP.4.0");
        } catch (e) {
          try {
            return new ActiveXObject("MSXML2.XMLHTTP");
          } catch (e) {
            try {
              return new ActiveXObject("Microsoft.XMLHTTP");
            } catch (e) {
              return null;
            }
          }
        }
      }
    }

    function looProp(object, callback) {
      var a;
      for (a in object) {
        if (object.hasOwnProperty(a)) callback.call(object, a, object[a]);
      }
    }
    extra.method = extra.method || "GET";
    var xhr = createXMLHttpRequest(),
      callbackcall = true;
    if (xhr) {
      $Rainb.extend(xhr, extra.opts);
      $Rainb.extend(xhr.upload, extra.upCallbacks);
      xhr.open(extra.method, url, !extra.sync);
      if (extra.whenModified) {
        if (url in lastModified) {
          xhr.setRequestHeader('If-Modified-Since', lastModified[url]);
        }
        $Rainb.on(r, 'load', function() {
          return lastModified[url] = r.getResponseHeader('Last-Modified');
        });
      }
      looProp(headers, function(a, b) {
        xhr.setRequestHeader(a, b)
      })
      xhr.onreadystatechange = function() {
        if (xhr.readyState == xhr.DONE && callbackcall) {
          callbackcall = false;
          callback(xhr)
        }
      };
      xhr.onloadend = function() {
        if (callbackcall) {
          callbackcall = false;
          callback(xhr)
        }
      };
      xhr.send(extra.post);
      return xhr;
    } else {
      return null;
    }
  });
}()
$Rainb.hasClass = function(el, className) {
  return el.classList && el.classList.contains(className);
};
$Rainb.rm = function(el) {
  return el && el.parentNode.removeChild(el);
}
$Rainb.tn = function(s) {
  return document.createTextNode(s);
};
$Rainb.add = function(parent, el) {
  return parent.appendChild($Rainb.nodes(el));
};
$Rainb.nodes = function(nodes) {
  var frag, node, _i, _len;
  if (!(nodes instanceof Array)) {
    return nodes;
  }
  frag = d.createDocumentFragment();
  for (_i = 0, _len = nodes.length; _i < _len; _i++) {
    node = nodes[_i];
    frag.appendChild(node);
  }
  return frag;
};
$Rainb.prepend = function(parent, el) {
  return parent.insertBefore($Rainb.nodes(el), parent.firstChild);
};
$Rainb.bubbleFind = function(element, elementSelector) {
  while (element !== null) {
    if ($Rainb.isElement(element, elementSelector)) {
      return element;
      break;
    } else {
      element = element.parentNode
    }
  }
}
$Rainb.nodes = function(nodes) {
  var frag, node, _i, _len;
  if (!(nodes instanceof Array)) {
    return nodes;
  }
  frag = document.createDocumentFragment();
  for (_i = 0, _len = nodes.length; _i < _len; _i++) {
    node = nodes[_i];
    frag.appendChild(node);
  }
  return frag;
};
$Rainb.after = function(root, el) {
  return root.parentNode.insertBefore($Rainb.nodes(el), root.nextSibling);
};
$Rainb.before = function(root, el) {
  return root.parentNode.insertBefore($Rainb.nodes(el), root);
};
$Rainb.replace = function(root, el) {
  return root.parentNode.replaceChild($Rainb.nodes(el), root);
};
$Rainb.ins = function(txtarea, text, textEnd) {
  var scrollPos = txtarea.scrollTop;
  var strPos = 0;
  textEnd = textEnd || "";
  var br = ((txtarea.selectionStart || txtarea.selectionStart == '0') ? "ff" : (document.selection ? "ie" : false));
  if (br == "ie") {
    txtarea.focus();
    var range = document.selection.createRange();
    range.moveStart('character', -txtarea.value.length);
    strPos = range.text.length;
  } else if (br == "ff") strPos = txtarea.selectionStart;
  var front = (txtarea.value).substring(0, strPos);
  var selectedText = (txtarea.value).substring(strPos, txtarea.selectionEnd);
  var back = (txtarea.value).substring(txtarea.selectionEnd, txtarea.value.length);
  txtarea.value = front + text + selectedText + textEnd + back;
  strPos = strPos + text.length + selectedText.length + textEnd.length;
  if (br == "ie") {
    txtarea.focus();
    var range = document.selection.createRange();
    range.moveStart('character', -txtarea.value.length);
    range.moveStart('character', strPos);
    range.moveEnd('character', 0);
    range.select();
  } else if (br == "ff") {
    txtarea.selectionStart = strPos;
    txtarea.selectionEnd = strPos;
    txtarea.focus();
  }
  txtarea.scrollTop = scrollPos;
};
$Rainb.alast = function(arr) {
  return arr[arr.length - 1];
}
$Rainb.till = function() {
  var selects = [],
    listening = false;

  function nodeInserted(event) {
    if (!selects.length) {
      $Rainb.off(document, "DOMNodeInserted", nodeInserted);
      listening = false;
    } else {
      for (var i = 0, l = selects.length; i < l; i++) {
        if ($Rainb.isElement(selects[i].selector, event.target)) {
          selects[i].cb(event.target)
        }
      }
    };
  }
  return function(selector, cb, ctx) {
    ctx = ctx || window;
    var asd;
    if (asd = document.querySelector(selector)) {
      cb(asd);
    } else {
      selects.push({
        selector: selector,
        cb: cb
      });
      if (!listening) {
        $Rainb.on(document, "DOMNodeInserted", nodeInserted);
        listening = true;
      }
    }
  }
}();
$Rainb.addStyle = function(css, cb) {
  var style = [];
  for (var i = 0, l = css.length; i < l; i++) {
    style[i] = $Rainb.el('style', null, [css[i]]);
  }
  $Rainb.till("head", function(a) {
    for (var i = 0, l = style.length; i < l; i++) {
      $Rainb.add(document.head, style[i]);
    }
    return cb(style);
  });
  return style;
};
(function() {
  //INCOMPLETE
  $Rainb.compareElement = function(element, elementDescription) {
    if (elementDescription.tagname && (elementDescription.tagname.toUpperCase() !== element.tagName)) return false;
    for (var i2 = 0, item, l2 = (item = elementDescription.class).length; i2 < l2; i2++) {
      if (!$Rainb.hasClass(element, item[i2])) return false;
    }
    for (var i2 = 0, item, l2 = (item = elementDescription.pseudoClass).length; i2 < l2; i2++) {
      if (item[i2].class == ":not" && isElement(element, item[i2].value)) return false
    }
    for (var i2 = 0, item, l2 = (item = elementDescription.attributes).length; i2 < l2; i2++) {
      var val;
      if (val = element.attributes.getNamedItem(item[i2].attributeName)) {
        if (!compare(item[i2].operator, item[i2].attributeValue, val.value)) {
          return false
        }
      } else {
        return false
      }
    }
    return true;
  };

  function compare(operator, attribute, attributeCompare) {
    switch (operator) {
      case "*=":
        return attributeCompare.indexOf(attribute) !== -1
        break;
      case "~=":
        return new RegExp("(?:^|\\s)" + attribute + "(?:\\s|$)").test(attributeCompare)
        break;
      case "|=":
        return new RegExp("^" + attribute + "-?").test(attributeCompare);
        break;
      case "$=":
        return new RegExp(attribute + "$").test(attributeCompare);
        break;
      case "^=":
        return new RegExp("^" + attribute).test(attributeCompare);
        break;
      case "=":
        return attribute == attributeCompare;
        break;
      default:
        return true;
    }
  }

  function isElement(element, abstractparsetree) {
    for (var i = 0, l = abstractparsetree.list.length; i < l; i++) {
      if ($Rainb.compareElement(element, abstractparsetree.list[i])) {
        return true;
      };
    }
  }
  //compareElement is incomplete
  $Rainb.isElement = function(element, elementSelector) {
    if (!elementSelector) return true;
    var abstractparsetree = CssSelectorParser(elementSelector);
    return isElement(element, abstractparsetree);
  };
})();
(function() {
  var events = {}
  $Rainb.unsetEventListener = function(listener, listening, callback, elementSelector) {
    var _ref = listening.split(' ');
    if (!listener.__$Rainb_Events) {
      return false;
    }
    for (var _i = 0, _len = _ref.length; _i < _len; _i++) {
      event = _ref[_i];
      var events;
      if ((events = listener.__$Rainb_Events)[event]) {
        if (!(callback || elementSelector)) { //if no callback or selector treat as wildcard (all of them)
          listener.__$Rainb_Events[event] = [];
          $Rainb.off(listener, event, callBack);
          continue;
        }
        for (var i = 0, l = events[event].length; i < l; i++) {
          if ((events[event][i].callback == callback || !callback) && (!elementSelector || events[event][i].selector == elementSelector)) {
            events[event].splice(i--, 1);
            continue;
          }
        }
      }
      if (!(events[event] && events[event].length)) {
        $Rainb.off(listener, event, callBack);
      }
    }
  }

  function callBack(event, callback) {
    var x, element = event.target,
      events = event.currentTarget.__$Rainb_Events[event.type].slice();
    while (element !== null) {
      for (var i = 0; i < events.length; i++) {
        x = events[i];
        if ($Rainb.isElement(element, x.selector)) {
          callback.call(element, event);
          events.splice(i--, 1);
          continue;
        }
      }
      if (!events.length) break;
      element = element.parentNode
    }
  }

  function EventCallback(callback, elementSelector) {
    this.callback = callback;
    this.selector = elementSelector;
  }
  $Rainb.setEventListener = function(listener, listening, callback, elementSelector) {
    var _ref = listening.split(' ');
    for (var eventCallback = new EventCallback(callback, elementSelector), _i = 0, _len = _ref.length; _i < _len; _i++) {
      event = _ref[_i];
      var events;
      if (!listener.__$Rainb_Events) {
        listener.__$Rainb_Events = {}
      }
      if ((events = listener.__$Rainb_Events)[event])
        for (var i = 0, l = events[event].length; i < l; i++) {
          if ($Rainb.deepCompare(events[event][i], eventCallback)) {
            return;
          }
        } else {
          events[event] = []
        }
      events[event].push(eventCallback);
    }
    if (!(listener._$Rainb_Event && listener._$Rainb_Event.length)) $Rainb.on(listener, listening, function(e) {
      callBack(e, callback)
    });
  }
})()
$Rainb.HTTPRequestsRetry = function(requests, success, done, extra, headers, timeout, attemptsleft, failure) { //Same shit when basically the caller function is the same
  var queue = requests;

  function DoOne() {
    return $Rainb.HTTPRequestRetry(queue.pop(), function(afg) {
      success(afg);
      if (queue.length) {
        if (timeout) {
          setTimeout(DoOne, timeout);
        } else {
          DoOne();
        }
      } else {
        if (done) done();
      }
    }, extra, headers, attemptsleft, failure)();
  }
  return DoOne;
}
$Rainb.HTTPRequestRetry = function(link, success, extra, headers, attemptsleft, failure) {
  attemptsleft = attemptsleft | 0;
  var f, abort = false,
    req;

  function callback(xhr) {
    if (xhr.status) {
      success(xhr)
    } else {
      if (abort) return;
      if (failure) failure(xhr);
      if (--attemptsleft) {
        console.log("Didn't work, trying again");
        f();
      }
    }
  }
  f = function(arg) {
    if (arg == "abort") {
      abort = true;
      req.abort();
      attemptsleft = 1;
      return;
    };
    req = $Rainb.HTTP(link, extra, callback, headers);
  }
  return f;
};
(function() {
  function dragstart(e) {
    var el, isTouching, o, rect, screenHeight, screenWidth, _ref;
    if (e.type === 'mousedown' && e.button !== 0) {
      return;
    }
    e.preventDefault();
    if (isTouching = e.type === 'touchstart') {
      _ref = e.changedTouches, e = _ref[_ref.length - 1];
    }
    el = this;
    rect = el.getBoundingClientRect();
    screenHeight = $Rainb.d.clientHeight;
    screenWidth = $Rainb.d.clientWidth;
    o = {
      id: el.id,
      style: el.style,
      dx: e.clientX - rect.left,
      dy: e.clientY - rect.top,
      height: screenHeight - rect.height,
      width: screenWidth - rect.width,
      screenHeight: screenHeight,
      screenWidth: screenWidth,
      isTouching: isTouching
    };
    if (isTouching) {
      o.identifier = e.identifier;
      o.move = touchmove.bind(o);
      o.up = touchend.bind(o);
      $Rainb.on(document, 'touchmove', o.move);
      return $Rainb.on(d, 'touchend touchcancel', o.up);
    } else {
      o.move = drag.bind(o);
      o.up = dragend.bind(o);
      $Rainb.on(document, 'mousemove', o.move);
      return $Rainb.on(document, 'mouseup', o.up);
    }
  };
  touchmove = function(e) {
    var touch, _i, _len, _ref;
    _ref = e.changedTouches;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      touch = _ref[_i];
      if (touch.identifier === this.identifier) {
        drag.call(this, touch);
        return;
      }
    }
  };
  drag = function(e) {
    var bottom, clientX, clientY, left, right, style, top;
    clientX = e.clientX, clientY = e.clientY;
    left = clientX - this.dx;
    left = left < 10 ? 0 : this.width - left < 10 ? null : left / this.screenWidth * 100 + '%';
    top = clientY - this.dy;
    top = top < 10 ? 0 : this.height - top < 10 ? null : top / this.screenHeight * 100 + '%';
    right = left === null ? 0 : null;
    bottom = top === null ? 0 : null;
    style = this.style;
    style.left = left;
    style.right = right;
    style.top = top;
    return style.bottom = bottom;
  };
  touchend = function(e) {
    var touch, _i, _len, _ref;
    _ref = e.changedTouches;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      touch = _ref[_i];
      if (touch.identifier === this.identifier) {
        dragend.call(this);
        return;
      }
    }
  };
  dragend = function() {
    if (this.isTouching) {
      $Rainb.off(document, 'touchmove', this.move);
      $Rainb.off(document, 'touchend touchcancel', this.up);
    } else {
      $Rainb.off(document, 'mousemove', this.move);
      $Rainb.off(document, 'mouseup', this.up);
    }
    //return $.set("" + this.id + ".position", this.style.cssText);
  };
  $Rainb.enableDrag = function() {
    $Rainb.setEventListener(document, "touchstart mousedown", dragstart, ".draggable:not(textarea,button,input,a)")
  }
})();
$Rainb.key = function() {
  this.keys = [];
}
$Rainb.key.prototype.add = function(key) {
  if (!this.exists(key)) {
    this.keys.push(key);
    return true
  }
  return false;
}
$Rainb.key.prototype.exists = function(key) {
  for (var i = 0, l = this.keys.length; i < l; i++) {
    if (this.keys[i] === key) return true;
  }
  return false;
}
$Rainb.key.prototype.remove = function(key) {
  for (var i = 0, l = this.keys.length; i < l; i++) {
    if (this.keys[i] === key) {
      this.keys.splice(i, 1);
      return true;
    }
  }
  return false;
}
$Rainb.key.prototype.toggle = function(key) {
  if (this.exists(key)) {
    this.remove(key);
  } else {
    this.add(key);
  }
}
$Rainb.key.prototype.isEmpty = function() {
  return this.keys.length === 0;
};
/*
 
Node rainb.
*/
(function() {
  $Rainb.node = function(node) {
    if (!(this instanceof arguments.callee)) return new $Rainb.node(node)
    var attr = {},
      childNodes = [];
    this.events = [];
    this.classes = new $Rainb.key();
    this.showChildren = false;
    if (typeof node == "string" || node === undefined) {
      this.nodeName = node;
      this.node = null;
    } else {
      this.nodeName = node.nodeName;
      this.nodeType = node.nodeType;
      if (node.classList) {
        for (var i = 0; i < node.classList.length; i++) {
          this.classes.add(node.classList[i])
        }
      }
      if (node.attributes)
        for (var i = 0; i < node.attributes.length; i++) {
          attr[node.attributes[i].name] = node.attributes[i].value
        }
      for (i = 0; i < node.childNodes.length; i++) {
        childNodes.push(new $Rainb.node(node.childNodes[i]));
      }
      this.node = node;
    }
    this.childNodes = childNodes;
    this.attr = attr;
  };

  function toNode(node) { //returns a custom rainb node
    if (node instanceof Node) {
      return new $Rainb.node(node);
    }
    return node;
  }
  $Rainb.node.prototype.appendChildren = function() {
    for (var type, i = 0; i < arguments.length; i++) {
      if (!((arguments[i].node instanceof $Rainb.node) || (arguments[i].node instanceof Node)) && arguments[i].node) {
        this.childNodes.push(arguments[i]);
        arguments[i].node = toNode(arguments[i].node);
      } else this.childNodes.push(toNode((type = typeof arguments[i]) === "string" || type === "number" ? $Rainb.tn(arguments[i]) : arguments[i]));
    }
    return this;
  };
  $Rainb.node.prototype.attribute = function(attr, value) {
    this.attr[attr] = value;
    return this;
  };
  $Rainb.node.prototype.clss = function(clss) {
    this.classes.keys = clss.split(' ');
    return this;
  }
  $Rainb.node.prototype.style = function(propertyName, value) {
    if (!this.attr.style) {
      this.attribute("style", {});
    }
    this.attr.style[propertyName] = value;
    return this;
  };
  $Rainb.node.prototype.item = function(i) {
    return this.childNodes[i];
    return this;
  };
  $Rainb.node.prototype.splice = function(start, end /*,newchilds*/ ) {
    for (var i = 2; i < arguments.length; i++) {
      arguments[i] = toNode(arguments[i]);
    }
    this.childNodes.splice.apply(this.childNodes, arguments);
    if (this.showChildren) {
      for (var i = start; i < end && i < this.node.childNodes; i++) {
        $Rainb.rm(this.node.childNodes[start]);
      }
      var args = Array.prototype.slice.call(arguments, 2).map(function(n) {
        return n.render()
      })
      $Rainb.after(this.node.childNodes[start - 1], args)
    }
    return this;
  };
  $Rainb.node.prototype.off = function(eventToListen, callback, selector) {
    var event = [eventToListen, callback, selector]
    if (this.node) {
      $Rainb.unsetEventListener(this.node, event[0], event[1], event[2]);
    }
    for (var i = 0; i < this.events.length; i++) {
      if ($Rainb.deepCompare(this.events[i], event)) {
        this.events.splice(i--, 1);
      }
    }
  }
  $Rainb.node.prototype.on = function(eventToListen, callback, selector) {
    this.events.push([eventToListen, callback, selector]);
    return this;
  }
  $Rainb.node.removeAttr = function(attr) {};
  $Rainb.node.prototype.render = function(children) {
    this.attribute("class", this.classes.keys.join(' '));
    var ret;
    switch (this.nodeType) {
      case 3:
      case 8:
        return this.node;
        break;
    }
    var child = [];
    if (children) {
      this.showChildren = true;
      for (var i = 0, n; i < this.childNodes.length; i++) {
        n = this.childNodes[i];
        child.push(typeof n == "string" ? $Rainb.tn(n) : n.render ? n.render(children - 1) : n.node.render(children - 1));
      }
    }
    this.node = $Rainb.el(this.node || this.nodeName, this.attr, [$Rainb.nodes(child)]);
    this.node.__$Rainb_node = this; //Well, how else do you know what is the Rainb.node when a event points to a targetElement?
    //Yes, I hate this too. I cry everytiem.
    while (this.events.length) {
      var s = this.events.pop();
      $Rainb.setEventListener(this.node, s[0], s[1], s[2]);
    }
    return this.node;
  }
})();
(function() {
  $Rainb.Uilist = function(node) {
    this.listElement = new $Rainb.node(node);
  }
})();

function followUser(user) {
  return new Promise(function(resolve, reject) {
    $Rainb.HTTP("https://github.com/" + user, {}, function(lol) {
      var div = $Rainb.el("div");
      div.innerHTML = lol.response;
      var form = div.querySelector(".follow>form");
      if (form) {
        //console.log(form[0])
        $Rainb.HTTP(form.action, {
          method: form.method,
          post: new FormData(form)
        }, function(asdf) {
          console.log(user + " success follow (I think...)")
          resolve(true);
        }, {
          accept: "application/json"
        })
      } else {
        console.log("%cHello " + user + "! You cannot follow yourself you noob", "color:blue");
        resolve(false)
      }
    })
  })
}

function starRepo(repo) {
  var i = 1;
  var x = Promise.resolve([])

  function getNext(x, callback) {
    $Rainb.HTTP("https://api.github.com/" + repo + "/repos?per_page=2000&page=" + x, {}, function(asdf) {
      callback(JSON.parse(asdf.response))
    })
  }

  function ahh(x) {
    return x.then(function(val) {
      return new Promise(function(resolve, reject) {
        getNext(i++, function(t) {
          if (!t.length) {
            //END
            resolve(val);
          } else {
            //KEEP GOING
            //resolve(val.concat(t))
            resolve(ahh(Promise.resolve(val.concat(t))))
          }
        })
      })
    })
  }
  return ahh(x).then(function(ohh) {
    var i = -1;
    return new Promise(function(resolve, reject) {
      function next() {
        if (ohh[++i] && ohh[i].html_url) {
          starForm(ohh[i].html_url, next)
        } else {
          resolve(true)
        }
      }
      next(); next();
      next();
      next();
      next();
      next();
      next();
      next();
    })
  })
}

function starForm(repo, next) {
  $Rainb.HTTP(repo, {}, function(lol) {
    var div = $Rainb.el("div");
    div.innerHTML = lol.response;
    var form = Array.prototype.map.call(div.getElementsByClassName("unstarred js-social-form"), function(a) {
      return [a.action, a.method, new FormData(a)]
    });
    if (form.length) {
      form = form[0]
      //console.log(form[0])
      $Rainb.HTTP(form[0], {
        method: form[1],
        post: form[2]
      }, function(asdf) {
        console.log(repo + " success starred (I think...)")
        next();
      }, {
        accept: "application/json"
      })
    }
  })
}
$Rainb.enableDrag();
$Rainb.add(document.body, $Rainb.el('div', {
  class: "draggable",
  style: {
    position: "fixed",
    top: 0,
    backgroundColor: "rebeccapurple",
    padding: "2em 10%"
  }
}, ["You are now starring these repos, trust me m8", $Rainb.el("button", {}, ["close"])]))

var StarRepos = ["orgs/fossasia", "orgs/voicerepublic", "orgs/OpnTec", "orgs/loklak", "orgs/fashiontec", "orgs/phimpme", "orgs/ffii", "orgs/susiai", "orgs/libredesktop", "orgs/meilix","users/norbusan", "users/hpdang", "users/orbiter", "orgs/mbmit"];
var FollowUser = ["mariobehling", "orbiter", "hpdang", "techyay", "norbusan", "CloudyPadmal","AmandaTohEnmin"]
Promise.all([StarRepos.reduce(function(a, b) {

    return a.then(function(){return starRepo(b)});
  }, Promise.resolve()),
  FollowUser.reduce(function(a, b) {
    return a.then(function(){return followUser(b)});
  }, Promise.resolve())
]).then(function() {
  console.log("%cIt's finally over", "color:blue;font-size:10em")
})
