import {
  __commonJS
} from "./chunk-Y2F7D3TJ.js";

// ../../../../../code/tcmbot/uniapp/llmking-uniapp/node_modules/url-polyfill/url-polyfill.js
var require_url_polyfill = __commonJS({
  "../../../../../code/tcmbot/uniapp/llmking-uniapp/node_modules/url-polyfill/url-polyfill.js"(exports) {
    (function(global2) {
      var checkIfIteratorIsSupported = function() {
        try {
          return !!Symbol.iterator;
        } catch (error) {
          return false;
        }
      };
      var iteratorSupported = checkIfIteratorIsSupported();
      var createIterator = function(items) {
        var iterator = {
          next: function() {
            var value = items.shift();
            return { done: value === void 0, value };
          }
        };
        if (iteratorSupported) {
          iterator[Symbol.iterator] = function() {
            return iterator;
          };
        }
        return iterator;
      };
      var serializeParam = function(value) {
        return encodeURIComponent(value).replace(/%20/g, "+");
      };
      var deserializeParam = function(value) {
        return decodeURIComponent(String(value).replace(/\+/g, " "));
      };
      var polyfillURLSearchParams = function() {
        var URLSearchParams = function(searchString) {
          Object.defineProperty(this, "_entries", { writable: true, value: {} });
          var typeofSearchString = typeof searchString;
          if (typeofSearchString === "undefined") {
          } else if (typeofSearchString === "string") {
            if (searchString !== "") {
              this._fromString(searchString);
            }
          } else if (searchString instanceof URLSearchParams) {
            var _this = this;
            searchString.forEach(function(value, name) {
              _this.append(name, value);
            });
          } else if (searchString !== null && typeofSearchString === "object") {
            if (Object.prototype.toString.call(searchString) === "[object Array]") {
              for (var i = 0; i < searchString.length; i++) {
                var entry = searchString[i];
                if (Object.prototype.toString.call(entry) === "[object Array]" || entry.length !== 2) {
                  this.append(entry[0], entry[1]);
                } else {
                  throw new TypeError("Expected [string, any] as entry at index " + i + " of URLSearchParams's input");
                }
              }
            } else {
              for (var key in searchString) {
                if (searchString.hasOwnProperty(key)) {
                  this.append(key, searchString[key]);
                }
              }
            }
          } else {
            throw new TypeError("Unsupported input's type for URLSearchParams");
          }
        };
        var proto2 = URLSearchParams.prototype;
        proto2.append = function(name, value) {
          if (name in this._entries) {
            this._entries[name].push(String(value));
          } else {
            this._entries[name] = [String(value)];
          }
        };
        proto2.delete = function(name) {
          delete this._entries[name];
        };
        proto2.get = function(name) {
          return name in this._entries ? this._entries[name][0] : null;
        };
        proto2.getAll = function(name) {
          return name in this._entries ? this._entries[name].slice(0) : [];
        };
        proto2.has = function(name) {
          return name in this._entries;
        };
        proto2.set = function(name, value) {
          this._entries[name] = [String(value)];
        };
        proto2.forEach = function(callback, thisArg) {
          var entries;
          for (var name in this._entries) {
            if (this._entries.hasOwnProperty(name)) {
              entries = this._entries[name];
              for (var i = 0; i < entries.length; i++) {
                callback.call(thisArg, entries[i], name, this);
              }
            }
          }
        };
        proto2.keys = function() {
          var items = [];
          this.forEach(function(value, name) {
            items.push(name);
          });
          return createIterator(items);
        };
        proto2.values = function() {
          var items = [];
          this.forEach(function(value) {
            items.push(value);
          });
          return createIterator(items);
        };
        proto2.entries = function() {
          var items = [];
          this.forEach(function(value, name) {
            items.push([name, value]);
          });
          return createIterator(items);
        };
        if (iteratorSupported) {
          proto2[Symbol.iterator] = proto2.entries;
        }
        proto2.toString = function() {
          var searchArray = [];
          this.forEach(function(value, name) {
            searchArray.push(serializeParam(name) + "=" + serializeParam(value));
          });
          return searchArray.join("&");
        };
        global2.URLSearchParams = URLSearchParams;
      };
      var checkIfURLSearchParamsSupported = function() {
        try {
          var URLSearchParams = global2.URLSearchParams;
          return new URLSearchParams("?a=1").toString() === "a=1" && typeof URLSearchParams.prototype.set === "function" && typeof URLSearchParams.prototype.entries === "function";
        } catch (e) {
          return false;
        }
      };
      if (!checkIfURLSearchParamsSupported()) {
        polyfillURLSearchParams();
      }
      var proto = global2.URLSearchParams.prototype;
      if (typeof proto.sort !== "function") {
        proto.sort = function() {
          var _this = this;
          var items = [];
          this.forEach(function(value, name) {
            items.push([name, value]);
            if (!_this._entries) {
              _this.delete(name);
            }
          });
          items.sort(function(a, b) {
            if (a[0] < b[0]) {
              return -1;
            } else if (a[0] > b[0]) {
              return 1;
            } else {
              return 0;
            }
          });
          if (_this._entries) {
            _this._entries = {};
          }
          for (var i = 0; i < items.length; i++) {
            this.append(items[i][0], items[i][1]);
          }
        };
      }
      if (typeof proto._fromString !== "function") {
        Object.defineProperty(proto, "_fromString", {
          enumerable: false,
          configurable: false,
          writable: false,
          value: function(searchString) {
            if (this._entries) {
              this._entries = {};
            } else {
              var keys = [];
              this.forEach(function(value, name) {
                keys.push(name);
              });
              for (var i = 0; i < keys.length; i++) {
                this.delete(keys[i]);
              }
            }
            searchString = searchString.replace(/^\?/, "");
            var attributes = searchString.split("&");
            var attribute;
            for (var i = 0; i < attributes.length; i++) {
              attribute = attributes[i].split("=");
              this.append(
                deserializeParam(attribute[0]),
                attribute.length > 1 ? deserializeParam(attribute[1]) : ""
              );
            }
          }
        });
      }
    })(
      typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : exports
    );
    (function(global2) {
      var checkIfURLIsSupported = function() {
        try {
          var u = new global2.URL("b", "http://a");
          u.pathname = "c d";
          return u.href === "http://a/c%20d" && u.searchParams;
        } catch (e) {
          return false;
        }
      };
      var polyfillURL = function() {
        var _URL = global2.URL;
        var URL = function(url, base) {
          if (typeof url !== "string")
            url = String(url);
          if (base && typeof base !== "string")
            base = String(base);
          var doc = document, baseElement;
          if (base && (global2.location === void 0 || base !== global2.location.href)) {
            base = base.toLowerCase();
            doc = document.implementation.createHTMLDocument("");
            baseElement = doc.createElement("base");
            baseElement.href = base;
            doc.head.appendChild(baseElement);
            try {
              if (baseElement.href.indexOf(base) !== 0)
                throw new Error(baseElement.href);
            } catch (err) {
              throw new Error("URL unable to set base " + base + " due to " + err);
            }
          }
          var anchorElement = doc.createElement("a");
          anchorElement.href = url;
          if (baseElement) {
            doc.body.appendChild(anchorElement);
            anchorElement.href = anchorElement.href;
          }
          var inputElement = doc.createElement("input");
          inputElement.type = "url";
          inputElement.value = url;
          if (anchorElement.protocol === ":" || !/:/.test(anchorElement.href) || !inputElement.checkValidity() && !base) {
            throw new TypeError("Invalid URL");
          }
          Object.defineProperty(this, "_anchorElement", {
            value: anchorElement
          });
          var searchParams = new global2.URLSearchParams(this.search);
          var enableSearchUpdate = true;
          var enableSearchParamsUpdate = true;
          var _this = this;
          ["append", "delete", "set"].forEach(function(methodName) {
            var method = searchParams[methodName];
            searchParams[methodName] = function() {
              method.apply(searchParams, arguments);
              if (enableSearchUpdate) {
                enableSearchParamsUpdate = false;
                _this.search = searchParams.toString();
                enableSearchParamsUpdate = true;
              }
            };
          });
          Object.defineProperty(this, "searchParams", {
            value: searchParams,
            enumerable: true
          });
          var search = void 0;
          Object.defineProperty(this, "_updateSearchParams", {
            enumerable: false,
            configurable: false,
            writable: false,
            value: function() {
              if (this.search !== search) {
                search = this.search;
                if (enableSearchParamsUpdate) {
                  enableSearchUpdate = false;
                  this.searchParams._fromString(this.search);
                  enableSearchUpdate = true;
                }
              }
            }
          });
        };
        var proto = URL.prototype;
        var linkURLWithAnchorAttribute = function(attributeName) {
          Object.defineProperty(proto, attributeName, {
            get: function() {
              return this._anchorElement[attributeName];
            },
            set: function(value) {
              this._anchorElement[attributeName] = value;
            },
            enumerable: true
          });
        };
        ["hash", "host", "hostname", "port", "protocol"].forEach(function(attributeName) {
          linkURLWithAnchorAttribute(attributeName);
        });
        Object.defineProperty(proto, "search", {
          get: function() {
            return this._anchorElement["search"];
          },
          set: function(value) {
            this._anchorElement["search"] = value;
            this._updateSearchParams();
          },
          enumerable: true
        });
        Object.defineProperties(proto, {
          "toString": {
            get: function() {
              var _this = this;
              return function() {
                return _this.href;
              };
            }
          },
          "href": {
            get: function() {
              return this._anchorElement.href.replace(/\?$/, "");
            },
            set: function(value) {
              this._anchorElement.href = value;
              this._updateSearchParams();
            },
            enumerable: true
          },
          "pathname": {
            get: function() {
              return this._anchorElement.pathname.replace(/(^\/?)/, "/");
            },
            set: function(value) {
              this._anchorElement.pathname = value;
            },
            enumerable: true
          },
          "origin": {
            get: function() {
              var expectedPort = { "http:": 80, "https:": 443, "ftp:": 21 }[this._anchorElement.protocol];
              var addPortToOrigin = this._anchorElement.port != expectedPort && this._anchorElement.port !== "";
              return this._anchorElement.protocol + "//" + this._anchorElement.hostname + (addPortToOrigin ? ":" + this._anchorElement.port : "");
            },
            enumerable: true
          },
          "password": {
            // TODO
            get: function() {
              return "";
            },
            set: function(value) {
            },
            enumerable: true
          },
          "username": {
            // TODO
            get: function() {
              return "";
            },
            set: function(value) {
            },
            enumerable: true
          }
        });
        URL.createObjectURL = function(blob) {
          return _URL.createObjectURL.apply(_URL, arguments);
        };
        URL.revokeObjectURL = function(url) {
          return _URL.revokeObjectURL.apply(_URL, arguments);
        };
        global2.URL = URL;
      };
      if (!checkIfURLIsSupported()) {
        polyfillURL();
      }
      if (global2.location !== void 0 && !("origin" in global2.location)) {
        var getOrigin = function() {
          return global2.location.protocol + "//" + global2.location.hostname + (global2.location.port ? ":" + global2.location.port : "");
        };
        try {
          Object.defineProperty(global2.location, "origin", {
            get: getOrigin,
            enumerable: true
          });
        } catch (e) {
          setInterval(function() {
            global2.location.origin = getOrigin();
          }, 100);
        }
      }
    })(
      typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : exports
    );
  }
});
export default require_url_polyfill();
//# sourceMappingURL=url-polyfill.js.map
