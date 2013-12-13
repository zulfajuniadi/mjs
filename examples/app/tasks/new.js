function makeId() {
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for (var i = 0; i < 10; i++)
		text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
}

mjs.Define({
	events: {
		'keyup #newTask': function(e) {
			if (e.keyCode === 27) {
				this.value = '';
			} else if (e.keyCode === 13) {
				var value = this.value;
				this.value = '';
				tasks.push({
					id: makeId(),
					title: value
				});
				mjs.SetDirty('tasks');
			}
		}
	}
});