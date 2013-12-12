mjs.Init({
	preInit: function(done, config) {
		var tasks = window.tasks = new PouchDB('tasks');
		done();
	},
	outlet: document.getElementById('outlet'),
	appUrl: 'app/',
	resources: ['tasks/new', 'tasks'],
	compiler: function(name, text) {
		Handlebars.registerPartial(name, text);
		return Handlebars.compile(text);
	},
	defaultRoute: '/tasks',
	postInit: function(done, config) {
		done();
	}
}, function() {
	// console.log('gogo power rangers')
});