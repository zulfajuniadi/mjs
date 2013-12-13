mjs.Define({
	events: {
		'keyup #newTask': function(e) {
			if (e.keyCode === 27) {
				this.value = '';
			} else if (e.keyCode === 13) {
				var value = this.value;
				this.value = '';
				tasks.post({
					title: value
				}, function(err, response) {
					if (err === null) {
						mjs.SetDirty('tasks');
					}
				});
			}
		}
	}
});