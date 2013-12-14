
function preInit(done, config) {
	console.log('preinit called');
	var tasks = window.tasks = storeLocal.get('tasks', []);
	done();
}

function compiler(name, text) {
	Handlebars.registerPartial(name, text);
	return Handlebars.compile(text);
}

function renderer(outlet, template, data) {
	outlet.innerHTML = template.compiled(data);
}

function postInit(done, config) {
	console.log('postinit called');
	done();
}

function startup() {
	console.log('gogo power rangers')
}


mjs.Init({
	defaultRoute: '/tasks',
	outlet: document.getElementById('outlet'),
	appUrl: 'app/',
	resources: ['tasks/new', 'tasks'],
	preInit: preInit,
	compiler: compiler,
	renderer : renderer,
	postInit: postInit
}, startup);


