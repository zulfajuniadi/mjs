/* http://projects.jga.me/routie/ */
/* (The MIT License) */

;(function(n){var e=[],t={},r="routie",o=n[r],i=function(n,e){this.name=e,this.path=n,this.keys=[],this.fns=[],this.params={},this.regex=a(this.path,this.keys,!1,!1)};i.prototype.addHandler=function(n){this.fns.push(n)},i.prototype.removeHandler=function(n){for(var e=0,t=this.fns.length;t>e;e++){var r=this.fns[e];if(n==r)return this.fns.splice(e,1),void 0}},i.prototype.run=function(n){for(var e=0,t=this.fns.length;t>e;e++)this.fns[e].apply(this,n)},i.prototype.match=function(n,e){var t=this.regex.exec(n);if(!t)return!1;for(var r=1,o=t.length;o>r;++r){var i=this.keys[r-1],a="string"==typeof t[r]?decodeURIComponent(t[r]):t[r];i&&(this.params[i.name]=a),e.push(a)}return!0},i.prototype.toURL=function(n){var e=this.path;for(var t in n)e=e.replace("/:"+t,"/"+n[t]);if(e=e.replace(/\/:.*\?/g,"/").replace(/\?/g,""),-1!=e.indexOf(":"))throw Error("missing parameters for url: "+e);return e};var a=function(n,e,t,r){return n instanceof RegExp?n:(n instanceof Array&&(n="("+n.join("|")+")"),n=n.concat(r?"":"/?").replace(/\/\(/g,"(?:/").replace(/\+/g,"__plus__").replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g,function(n,t,r,o,i,a){return e.push({name:o,optional:!!a}),t=t||"",""+(a?"":t)+"(?:"+(a?t:"")+(r||"")+(i||r&&"([^/.]+?)"||"([^/]+?)")+")"+(a||"")}).replace(/([\/.])/g,"\\$1").replace(/__plus__/g,"(.+)").replace(/\*/g,"(.*)"),RegExp("^"+n+"$",t?"":"i"))},s=function(n,r){var o=n.split(" "),a=2==o.length?o[0]:null;n=2==o.length?o[1]:o[0],t[n]||(t[n]=new i(n,a),e.push(t[n])),t[n].addHandler(r)},h=function(n,e){if("function"==typeof e)s(n,e),h.reload();else if("object"==typeof n){for(var t in n)s(t,n[t]);h.reload()}else e===void 0&&h.navigate(n)};h.lookup=function(n,t){for(var r=0,o=e.length;o>r;r++){var i=e[r];if(i.name==n)return i.toURL(t)}},h.remove=function(n,e){var r=t[n];r&&r.removeHandler(e)},h.removeAll=function(){t={},e=[]},h.navigate=function(n,e){e=e||{};var t=e.silent||!1;t&&l(),setTimeout(function(){window.location.hash=n,t&&setTimeout(function(){p()},1)},1)},h.noConflict=function(){return n[r]=o,h};var f=function(){return window.location.hash.substring(1)},c=function(n,e){var t=[];return e.match(n,t)?(e.run(t),!0):!1},u=h.reload=function(){for(var n=f(),t=0,r=e.length;r>t;t++){var o=e[t];if(c(n,o))return}},p=function(){n.addEventListener?n.addEventListener("hashchange",u,!1):n.attachEvent("onhashchange",u)},l=function(){n.removeEventListener?n.removeEventListener("hashchange",u):n.detachEvent("onhashchange",u)};p(),n[r]=h})(window);

(function(globals) {
	'use strict';

	var mjs = {
		Runtime: {}
	},
		eventMaps = mjs.Runtime.events = {},
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
				callback.call(globals);
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
					data[self.name].apply(globals, args);
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
						var elements = mjs.O2A(document.querySelectorAll(eventSelector));
						elements.forEach(function(el) {
							return mjs.Bind(el, eventType, eventMaps[template][property]);
						});
					}
				}
			});
		}
	}

	mjs.setRendered = function(template) {
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

	mjs.setDirty = function(resource, args) {
		templates[resource].render.apply(templates[resource], args);
	}

	mjs.Init = function(config, callback) {
		if (callback === undefined) {
			callback = config;
			config = {};
		}

		function postInitDone() {
			delete mjs.Define;
			routie('*', function() {
				routie(defaultRoute);
			});
			if (typeof callback === 'function') {
				callback.call(globals);
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
						routie(config.handle, function(){
							var args = mjs.O2A(arguments);
							mjs.setDirty.call(globals, resource, args);
						});
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
		mjs.setRendered(template);
	});

	/* Factory */

	if (typeof define !== 'undefined' && define.amd) {
		define([], function() {
			return mjs;
		}); // RequireJS
	} else if (typeof module !== 'undefined' && module.exports) {
		module.exports = mjs; // CommonJS
	} else {
		globals.mjs = mjs; // <script>
	}

	mjs.O2A(document.getElementsByTagName('script')).forEach(function(script){
		if(typeof script.dataset.mjsapp !== 'undefined') {
			mjs.GetScript(script.dataset.mjsapp);
		}
	});
})(this);