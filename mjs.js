/* http://projects.jga.me/routie/ */
/* MIT License */

/* MJS */
/* https://github.com/zulfajuniadi/mjs */
/* MIT License */

(function(w) {
	'use strict';

	var mjs = {
		Runtime: {}
	};
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

	mjs.Router = routie;

	var eventMaps = mjs.Runtime.events = {},
		renderMaps = mjs.Runtime.rendered = {},
		templates = mjs.Runtime.templates = {},
		data = mjs.Runtime.data = {},
		compiler = function(name, text) {
			return function(data) {
				return text;
			};
		},
		rootUrl = 'app/',
		loaded = [],
		defaultRoute,
		config,
		outlet,
		defaultElement;

	/* Primary Functions */

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

	mjs.GetTemplate = function(url, name, next) {
		mjs.Get(url, function(result) {
			var template = compiler(name, result);
			templates[name] = {
				name: name,
				template: template,
				render: function() {
					var self = this;

					function done(data) {
						outlet.innerHTML = self.template(data);
						mjs.Fire(document, 'templateRendered', {
							template: self.name
						});
					}
					var args = mjs.O2A(arguments);
					args.unshift(done);
					data[self.name].apply(w, args);
				}
			}
			next();
		});
	}

	mjs.Events = function(template, eventMap) {
		if (eventMaps[template] === undefined) {
			eventMaps[template] = {};
		}
		eventMaps[template] = eventMap;
	}

	mjs.Rendered = function(template, callbacks) {
		if (!Array.isArray(callbacks)) {
			callbacks = [callbacks];
		}
		if (renderMaps[template] === undefined) {
			renderMaps[template] = [];
		}
		callbacks.forEach(function(callback) {
			if (renderMaps[template].indexOf(callback) === -1)
				renderMaps[template].push(callback);
		});
		if (eventMaps[template]) {
			renderMaps[template].push(function(){
				for (var property in eventMaps[template]) {
					if (eventMaps[template].hasOwnProperty(property)) {
						var eventKeySplitted = property.split(' ');
						var eventType = eventKeySplitted.shift();
						var eventSelector = eventKeySplitted.join(' ');
						mjs.O2A(outlet.childNodes).forEach(function(child){
							if(child.tagName) {
								return mjs.Delegate(child, eventType, eventSelector, eventMaps[template][property]);
							}
						})
						// var elements = mjs.O2A(document.querySelectorAll(eventSelector));
						// elements.forEach(function(el) {
						// 	return mjs.Bind(el, eventType, eventMaps[template][property]);
						// });
					}
				}
			});
		}
	}

	mjs.SetRendered = function(template) {
		if (renderMaps[template]) {
			renderMaps[template].forEach(function(callback) {
				callback.call(window);
			});
		}
	}

	mjs.Data = function(resource, callback) {
		data[resource] = callback;
	}

	mjs.Load = function(resource, callback) {
		var resourceName = resource;
		var baseUrl = rootUrl + resourceName + '/' + resourceName;
		if (resource.indexOf('/') > -1) {
			baseUrl = rootUrl + resource;
		}

		if (loaded.indexOf(resource) === -1) {
			mjs.GetTemplate(baseUrl + '.html', resource, function() {
				mjs.GetScript(baseUrl + '.js', function() {
					if (callback) {
						loaded.push(resource);
						callback.call(templates[resource]);
					}
				});
			});
		} else {
			callback.call(templates[resource]);
		}
	}

	mjs.SetDirty = function(resource, args) {
		templates[resource].render.apply(templates[resource], args);
	}

	mjs.Init = function(config, callback) {
		if (callback === undefined) {
			callback = config;
			config = {};
		}

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
			compiler = config.compiler || compiler;
			rootUrl = config.appUrl || rootUrl;
			defaultRoute = config.defaultRoute || defaultRoute;
			outlet = config.outlet || outlet;
			var resources = config.resources || [];

			mjs.AsyncEach(resources, function(resource, done) {
				mjs.Define = function(config) {
					var config = config || {};
					if (config.events) {
						mjs.Events(resource, config.events);
					}
					if (config.rendered === undefined) {
						config.rendered = [];
					}
					if (config.data) {
						mjs.Data(resource, config.data);
					} else {
						mjs.Data(resource, function(done) {
							done();
						});
					}
					mjs.Rendered(resource, config.rendered);
					if(config.handle) {
						mjs.Router(config.handle, function(){
							var args = mjs.O2A(arguments);
							mjs.SetDirty.call(w, resource, args);
						}, true);
					} else {
						mjs.Router.reload();
					}
				};
				mjs.Load(resource, done);
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
	}

	/* utilities */

	mjs.Bind(document, 'templateRendered', function(e) {
		var template = e.data.template;
		mjs.SetRendered(template);
	});

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