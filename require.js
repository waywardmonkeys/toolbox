
// define('module-name', [dependeny, ...], function (exports) { ... })
// require(['module-name', ...], function (exports) { ... })

var require, define, contexts = {};

(function () {
    var modules = {};
    var requests = 0;
    var callbacks = {};
	var head = document.getElementsByTagName('head')[0];
	var href = document.location.href;
	var root = href.substring(0, href.lastIndexOf('/') + 1);

	function load (name, callback) {
		if (!callbacks[name]) {
			callbacks[name] = [callback];
			var url = root + name + '.js';

			var timestamp = (new Date()).getTime();
			url += '?time=' + timestamp;

			var iframe = document.createElement('iframe');
			iframe.style.display = 'none';
			document.body.appendChild(iframe);
			iframe.contentWindow.eval("(function () {"
									  + "var script = document.createElement('script');"
									  + "script.setAttribute('src', '" + url + "');"
									  + "document.head.appendChild(script);"
									  + "})()");
			contexts[name] = iframe.contentWindow;
		} else
			callbacks[name].push(callback);
	};

	function ensureLoaded (dependencies, callback) {
		for (var i = 0, n = dependencies.length; i < n; i++) {
			var dependency = dependencies[i];
			if (!modules.hasOwnProperty(dependency)) {
				load(dependency, callback);
				return false;
			}
		};
		return true;
	}

	require = function (dependencies, body) {
		(function check () {
			if (ensureLoaded(dependencies, check)) {
  				body.apply(null, dependencies.map(function (name) {
					return modules[name];
				}));
			}
		})();
	};

	function inject (module, dependencies) {
		for (var i = 0, n = dependencies.length; i < n; i++) {
			var dependency = dependencies[i];
			var importedModule = modules[dependency];
			for (var property in importedModule) {
				if (importedModule.hasOwnProperty(property)) {
					module[property] = importedModule[property];
				}
			}
		}
	}

	define = function (name, dependencies, factory) {
		(function check () {
			if (ensureLoaded(dependencies, check)) {
				var module = {};
				inject(contexts[name], dependencies);
				factory(module);
				modules[name] = module;
				callbacks[name].forEach(function (callback) {
					callback();
				});
				callbacks[name] = [];
			}
		})();
	};
})();
