/* http://projects.jga.me/routie/ */
/* MIT License */

/* MJS */
/* https://github.com/zulfajuniadi/mjs */
/* MIT License */

(function(w) {
	'use strict';
	var routes = [];
	var map = {};

	var Route = function(path, name) {
		this.name = name;
		this.path = path;
		this.keys = [];
		this.fns = [];
		this.params = {};
		this.regex = pathToRegexp(this.path, this.keys, false, false);

	};

	Route.prototype.addHandler = function(fn) {
		this.fns.push(fn);
	};

	Route.prototype.removeHandler = function(fn) {
		for (var i = 0, c = this.fns.length; i < c; i++) {
			var f = this.fns[i];
			if (fn == f) {
				this.fns.splice(i, 1);
				return;
			}
		}
	};

	Route.prototype.run = function(params) {
		for (var i = 0, c = this.fns.length; i < c; i++) {
			this.fns[i].apply(this, params);
		}
	};

	Route.prototype.match = function(path, params) {
		var m = this.regex.exec(path);

		if (!m) return false;


		for (var i = 1, len = m.length; i < len; ++i) {
			var key = this.keys[i - 1];

			var val = ('string' == typeof m[i]) ? decodeURIComponent(m[i]) : m[i];

			if (key) {
				this.params[key.name] = val;
			}
			params.push(val);
		}

		return true;
	};

	Route.prototype.toURL = function(params) {
		var path = this.path;
		for (var param in params) {
			path = path.replace('/:' + param, '/' + params[param]);
		}
		path = path.replace(/\/:.*\?/g, '/').replace(/\?/g, '');
		if (path.indexOf(':') != -1) {
			throw new Error('missing parameters for url: ' + path);
		}
		return path;
	};

	var pathToRegexp = function(path, keys, sensitive, strict) {
		if (path instanceof RegExp) return path;
		if (path instanceof Array) path = '(' + path.join('|') + ')';
		path = path
			.concat(strict ? '' : '/?')
			.replace(/\/\(/g, '(?:/')
			.replace(/\+/g, '__plus__')
			.replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, function(_, slash, format, key, capture, optional) {
				keys.push({
					name: key,
					optional: !! optional
				});
				slash = slash || '';
				return '' + (optional ? '' : slash) + '(?:' + (optional ? slash : '') + (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')' + (optional || '');
			})
			.replace(/([\/.])/g, '\\$1')
			.replace(/__plus__/g, '(.+)')
			.replace(/\*/g, '(.*)');
		return new RegExp('^' + path + '$', sensitive ? '' : 'i');
	};

	var addHandler = function(path, fn) {
		var s = path.split(' ');
		var name = (s.length == 2) ? s[0] : null;
		path = (s.length == 2) ? s[1] : s[0];

		if (!map[path]) {
			map[path] = new Route(path, name);
			routes.push(map[path]);
		}
		map[path].addHandler(fn);
	};

	var routie = function(path, fn, silent) {
		if (silent === undefined) {
			silent = false
		}
		if (typeof fn == 'function') {
			addHandler(path, fn);
			if(silent !== true)
				routie.reload();
		} else if (typeof path == 'object') {
			for (var p in path) {
				addHandler(p, path[p]);
			}
			if(silent !== true)
				routie.reload();
		} else if (typeof fn === 'undefined') {
			routie.navigate(path);
		}
	};

	routie.lookup = function(name, obj) {
		for (var i = 0, c = routes.length; i < c; i++) {
			var route = routes[i];
			if (route.name == name) {
				return route.toURL(obj);
			}
		}
	};

	routie.remove = function(path, fn) {
		var route = map[path];
		if (!route)
			return;
		route.removeHandler(fn);
	};

	routie.removeAll = function() {
		map = {};
		routes = [];
	};

	routie.navigate = function(path, options) {
		options = options || {};
		var silent = options.silent || false;

		if (silent) {
			removeListener();
		}
		setTimeout(function() {
			window.location.hash = path;

			if (silent) {
				setTimeout(function() {
					addListener();
				}, 1);
			}

		}, 1);
	};

	var getHash = function() {
		return window.location.hash.substring(1);
	};

	var checkRoute = function(hash, route) {
		var params = [];
		if (route.match(hash, params)) {
			route.run(params);
			return true;
		}
		return false;
	};

	var hashChanged = routie.reload = function() {
		var hash = getHash();
		for (var i = 0, c = routes.length; i < c; i++) {
			var route = routes[i];
			if (checkRoute(hash, route)) {
				return;
			}
		}
	};

	var addListener = function() {
		if (w.addEventListener) {
			w.addEventListener('hashchange', hashChanged, false);
		} else {
			w.attachEvent('onhashchange', hashChanged);
		}
	};

	var removeListener = function() {
		if (w.removeEventListener) {
			w.removeEventListener('hashchange', hashChanged);
		} else {
			w.detachEvent('onhashchange', hashChanged);
		}
	};
	addListener();

	/** =====================================================================
	 *
	 *	MJS PROTOTYPES STARTS HERE
	 *
	 * ======================================================================
	 */


	var mjs = function(outlet, config, callback){
		if(config === undefined) {
			config = {};
		}
		var self = this;
		this.outlet = outlet;
		this.config = config;
		this.Init(config, callback);
		return this;
	}, compiler = function(name, text) {
		return function(data) {
			return text;
		};
	};


	mjs.prototype.Init = function(config, callback) {

		var self = this;

		function postInitDone() {
			delete mjs.Define;
			mjs.Router('*', function() {
				mjs.Router(defaultRoute);
			});
			if (typeof callback === 'function') {
				callback.call(w);
			}
		}

		function preInitDone() {
			self.rootUrl = config.appUrl || self.rootUrl;
			var resources = config.resources || [];

			mjs.AsyncEach(resources, function(resource, done) {
				mjs.Define = function(config) {
					var config = config || {};
					if (config.events) {
						self.Events(resource, config.events);
					}
					if (config.rendered === undefined) {
						config.rendered = [];
					}
					if (config.data) {
						self.Data(resource, config.data);
					} else {
						self.Data(resource, function(done) {
							done();
						});
					}
					self.Rendered(resource, config.rendered);
					if(config.handle) {
						mjs.Router(config.handle, function(){
							var args = mjs.O2A(arguments);
							self.SetDirty.call(self, resource, args);
						}, true);
					} else {
						mjs.Router.reload();
					}
				};
				self.Load(resource, done);
			}, function() {
				if (config.postInit) {
					config.postInit(postInitDone, config);
				} else {
					postInitDone();
				}
			});
		}

		if (config.preInit) {
			config.preInit(preInitDone, config);
		} else {
			preInitDone();
		}

		mjs.Bind(document, 'templateRendered', function(e) {
			var template = e.data.template;
			self.SetRendered(template);
		});
	}

	mjs.prototype.Load = function(resource, callback) {
		var self = this;
		var resourceName = resource;
		var baseUrl = self.rootUrl + resourceName + '/' + resourceName;
		if (resource.indexOf('/') > -1) {
			baseUrl = self.rootUrl + resource;
		}

		if (self.loaded.indexOf(resource) === -1) {
			self.GetTemplate(baseUrl + '.html', resource, function() {
				mjs.GetScript(baseUrl + '.js', function() {
					if (callback) {
						self.loaded.push(resource);
						callback.call(self.templates[resource]);
					}
				});
			});
		} else {
			callback.call(self.templates[resource]);
		}
	}

	mjs.prototype.GetTemplate = function(url, name, next) {
		var self = this;
		mjs.Get(url, function(result) {
			var template = compiler(name, result);
			self.templates[name] = {
				name: name,
				template: template,
				render: function() {
					var context = this;
					function done(data) {
						self.outlet.innerHTML = context.template(data);
						mjs.Fire(document, 'templateRendered', {
							template: context.name
						});
					}
					var args = mjs.O2A(arguments);
					args.unshift(done);
					self.data[context.name].apply(w, args);
				}
			}
			next();
		});
	}

	mjs.prototype.Events = function(resource, eventMap) {
		if (this.eventMaps[resource] === undefined) {
			this.eventMaps[resource] = {};
		}
		this.eventMaps[resource] = eventMap;
	}

	mjs.prototype.Data = function(resource, callback) {
		this.data[resource] = callback;
	}

	mjs.prototype.Rendered = function(template, callbacks) {
		var self = this;
		if (!Array.isArray(callbacks)) {
			callbacks = [callbacks];
		}
		if (self.renderMaps[template] === undefined) {
			self.renderMaps[template] = [];
		}
		callbacks.forEach(function(callback) {
			if (self.renderMaps[template].indexOf(callback) === -1)
				self.renderMaps[template].push(callback);
		});
		if (self.eventMaps[template]) {
			self.renderMaps[template].push(function(){
				for (var property in self.eventMaps[template]) {
					if (self.eventMaps[template].hasOwnProperty(property)) {
						var eventKeySplitted = property.split(' ');
						var eventType = eventKeySplitted.shift();
						var eventSelector = eventKeySplitted.join(' ');
						mjs.O2A(self.outlet.childNodes).forEach(function(child){
							if(child.tagName) {
								return mjs.Delegate(child, eventType, eventSelector, self.eventMaps[template][property]);
							}
						})
					}
				}
			});
		}
	}

	mjs.prototype.SetRendered = function(template) {
		var self = this;
		if (this.renderMaps[template]) {
			this.renderMaps[template].forEach(function(callback) {
				callback.call(self);
			});
		}
	}

	mjs.prototype.SetDirty = function(resource, args) {
		this.templates[resource].render.apply(this.templates[resource], args);
	}

	var defaultRoute,
		defaults = {
			loaded : [],
			config : {},
			outlet : document.body,
			templates : {},
			rootUrl : '/',
			eventMaps : {},
			data : {},
			renderMaps : {}
		};

	for(var property in defaults) {
		if(defaults.hasOwnProperty(property)) {
			mjs.prototype[property] = defaults[property];
		}
	}

	/** =====================================================================
	 *
	 *	MJS PROTOTYPES ENDS HERE
	 *
	 * ======================================================================
	 */

	/* Utility Functions */

	mjs.Router = routie;

	mjs.Extend = function(destination, source) {
		for (var property in source) {
			if (destination[property]
				&& (typeof(destination[property]) == 'object')
				&& (destination[property].toString() == '[object Object]')
				&& source[property])
				Extend(destination[property], source[property]);
			else
				destination[property] = source[property];
		}
		return destination;
	}

	mjs.Bind = function(element, type, handler) {
		if (element.addEventListener) {
			element.addEventListener(type, handler, false);
		} else {
			element.attachEvent('on' + type, handler);
		}
	}

	mjs.Delegate = function(element, type, target, handler) {
		function delegateHandler(event) {
			var elements = mjs.O2A(document.querySelectorAll(target));
			var elementIndex = elements.indexOf(event.target);
			if(elementIndex > -1) {
				handler.call(elements[elementIndex], event);
			}
		}
		if (element.addEventListener) {
			element.addEventListener(type, delegateHandler, false);
		} else {
			element.attachEvent('on' + type, delegateHandler);
		}
	}

	mjs.O2A = function(object) {
		var returnArray = [];
		for (var property in object) {
			if (object.hasOwnProperty(property)) {
				if (property !== 'length')
					returnArray.push(object[property]);
			}
		}
		return returnArray;
	}

	mjs.Fire = function(element, type, data) {
		var event;
		var data = data || {};
		if (document.createEvent) {
			event = document.createEvent("HTMLEvents");
			event.initEvent(type, true, true);
		} else {
			event = document.createEventObject();
			event.eventType = type;
		}
		event.data = data;

		if (document.createEvent) {
			element.dispatchEvent(event);
		} else {
			element.fireEvent("on" + event.eventType, event);
		}
	}

	mjs.Get = function(url, callback) {
		var httpRequest;

		function doCallback() {
			if (httpRequest.readyState === 4) {
				if (httpRequest.status === 200) {
					return callback.call(window, httpRequest.response);
				}
				console.error('there was a problem in processing the request', httpRequest);
			}
		}

		try {
			if (window.XMLHttpRequest) {
				httpRequest = new XMLHttpRequest();
			} else if (window.ActiveXObject) {
				httpRequest = new ActiveXObject("Microsoft.XMLHTTP");
			}

			if (!httpRequest) {
				alert('Giving up :( Cannot create an XMLHTTP instance');
				return false;
			}

			httpRequest.onreadystatechange = doCallback;
			httpRequest.open('GET', url);
			httpRequest.send();
		} catch (e) {
			console.error(e);
		}
	}

	mjs.GetScript = function(url, callback) {
		var callback = callback || function(){};
		var script = document.createElement('script');
		script.onload = callback;
		script.src = url;
		window.document.getElementsByTagName('head')[0].appendChild(script);
	}

	mjs.AsyncEach = function(array, iterator, callback) {
		var i = -1;

		function next() {
			i++;
			if (i < array.length) {
				iterator(array[i], next);
			} else {
				callback.call(w);
			}
		}
		next();
	}

	/* Secondary functions */
	mjs.Configure = function(options) {
		var options = options || {};
		compiler = options.compiler || compiler;
		defaultRoute = options.defaultRoute || defaultRoute;
	}

	/* Factory */

	if (typeof define !== 'undefined' && define.amd) {
		define([], function() {
			return mjs;
		}); // RequireJS
	} else if (typeof module !== 'undefined' && module.exports) {
		module.exports = mjs; // CommonJS
	} else {
		w.mjs = mjs; // <script>
	}

	mjs.O2A(document.getElementsByTagName('script')).forEach(function(script){
		if(typeof script.dataset.mjsapp !== 'undefined') {
			mjs.GetScript(script.dataset.mjsapp);
		}
	});
})(this);