var content = document.getElementById('content');
var tasks = window.tasks = new PouchDB('tasks');

mjs.Configure({
	defaultRoute : '/tasks',
	compiler: function(name, text) {
		Handlebars.registerPartial(name, text);
		return Handlebars.compile(text);
	}
});

var MjsContentInstance = new mjs(content, {
	appUrl: 'app/content/',
	resources : ['tasks/new', 'tasks'],
	preInit : function(done, config) {
		console.log('preInit called');
		done();
	},
	postInit : function(done, config) {
		console.log('postInit called');
		done();
	}
}, function(){
	console.log('mjs outlet completed loading')
});