mjs.Define({
	handle: '/tasks',
	events: {
		'click .remove': function(e) {
			if (typeof e.target.dataset.id !== 'undefined') {
				var id = e.target.dataset.id;
				var rev = e.target.dataset.rev;
				tasks.remove({
					_id: id,
					_rev: rev
				}, function(err, response) {
					if (err === null)
						mjs.setDirty('tasks');
				})
			}
		}
	},
	data: function(done) {
		if (tasks) {
			tasks.allDocs({
				include_docs: true
			}, function(err, data) {
				if (err) {
					console.error(err);
				}
				if (data && data.rows) {
					return done(data.rows);
				}
				done([]);
			})
		}
	},
	rendered: function() {
		mjs.setRendered('tasks/new');
		document.getElementById('newTask').focus();
	}
});