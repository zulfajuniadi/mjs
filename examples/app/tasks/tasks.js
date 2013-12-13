mjs.Define({
	handle: '/tasks',
	partials : ['tasks/new'],
	events: {
		'click .remove': function(e) {
			if (typeof e.target.dataset.id !== 'undefined') {
				var id = e.target.dataset.id;
				tasks = tasks.filter(function(task){
					return task.id !== id
				});
				mjs.SetDirty('tasks');
			}
		}
	},
	data: function(done) {
		if (tasks) {
			return done({
				tasks : tasks
			});
		}
		done();
	},
	rendered: function() {
		storeLocal.set('tasks', tasks);
		document.getElementById('newTask').focus();
	}
});