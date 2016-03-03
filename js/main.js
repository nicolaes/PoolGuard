(function () {
	//var storage = chrome.storage.local;
	var config = {
		motionThreshold: 1,
		timeThreshold: 300,
		slackHookUri: 'https://hooks.slack.com/services/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'
	};
	var storage = {
		'get': function(key) {
			return config[key]
		},
		'set': function(obj) {
			config = Object.assign({}, config, obj);
			console.log('set', obj, config);
		}
	};

	var noMotionNotificationId = 0,
		intervalCheck = null,
		lastMotionDate = Date.now(),
		noMotionAnnouncedAt = 0;

	var $logger = $('#logger');

	function init() {
		$('#startbutton').click(function () {
			if (!validateSettings()) {
				logMessage('Please configure the settings first.');
			} else if (intervalCheck === null) {
				intervalCheck = startIntervalCheck();
				logMessage('Started checking for motion');
			}

			return false;
		});

		$('#stopbutton').click(function () {
			if (intervalCheck !== null) {
				clearInterval(intervalCheck);
				logMessage('Stopper checking for motion');
				intervalCheck = null;
			}
			return false;
		});

		$('#showLogger').change(function () {
			$logger.toggle(this.checked);
		});

		$('#motionThreshold')
			.val(storage.get('motionThreshold'))
			.change(function () {
				var newVal = parseInt($(this).val());
				if (!newVal) return;

				storage.set({motionThreshold: newVal});
				logMessage('Changed motion threshold to ' + storage.get('motionThreshold'));
			});

		$('#timeThreshold')
			.val(storage.get('timeThreshold'))
			.change(function () {
				var newVal = parseInt($(this).val());
				if (!newVal) return;

				storage.set({timeThreshold: newVal});
				logMessage('Changed time threshold to ' + storage.get('timeThreshold'));
			});

		$('#slackHookUri')
			.val(storage.get('slackHookUri'))
			.change(function () {
				var newVal = $(this).val();
				if (!newVal) return;

				storage.set({slackHookUri: newVal});
				logMessage('Changed Slack URI to ' + storage.get('slackHookUri'));
			});
	}

	function validateSettings() {
		return (
			storage.get('slackHookUri') &&
			parseInt(storage.get('motionThreshold')) &&
			parseInt(storage.get('timeThreshold'))
		);
	}

	function logMessage(message) {
		$logger.val(message + "\n" + $logger.val());
	}

	function startIntervalCheck() {
		var thisPicture = null,
			lastPicture = null;

		return setInterval(function () {
			lastPicture = thisPicture;
			thisPicture = window.takepicture();

			if (lastPicture !== null && thisPicture !== null) {
				resemble(thisPicture)
					.compareTo(lastPicture)
					.ignoreColors()
					.onComplete(function (data) {
						var percentage = 'Percentage: ' + data.misMatchPercentage + '%';
						if (data.misMatchPercentage > storage.get('motionThreshold')) {
							logMessage('Motion detected. ' + percentage);
							lastMotionDate = Date.now();

							if (noMotionNotificationId > 0) {
								noMotionNotificationId = 0;
								//sendSlackMessage('poolTabl3Reoccupied');
								sendSlackMessage('The pool table is used again');

								var langs = ['en', 'en', 'en', 'en', 'en', 'es', 'fr', 'de'];
								var lang = langs[Math.floor(Math.random()*langs.length)];

								var spokenMsg = new SpeechSynthesisUtterance('Welcome to the pool table!');
								spokenMsg.lang = lang;
								window.speechSynthesis.speak(spokenMsg);
							}
						} else {
							logMessage('No motion detected. ' + percentage);
							checkMotionLoop();
						}
					});
			}
		}, 1000);
	}

	function sendSlackMessage(message) {
		try {
			fetch(storage.get('slackHookUri'), {
				method: 'post',
				body: JSON.stringify({
					text: message
				})
			});

			logMessage('Sent to Slack: ' + message);
		} catch (err) {
			logMessage('No internet connectivity or incorrect Slack hook URI. Check console.');
			console.error(err);
		}
	}

	function checkMotionLoop() {
		var now = Date.now();
		var noMotionTime = Math.round((now - lastMotionDate) / 1000);
		var noMotionAnnouncedTime = Math.round((now - noMotionAnnouncedAt) / 1000);

		var timeThreshold = storage.get('timeThreshold');
		if (noMotionTime >= timeThreshold && noMotionAnnouncedTime >= timeThreshold) {
			noMotionAnnouncedAt = now;
			noMotionNotificationId++;

			//var message = 'No motion in ' + noMotionTime + ' seconds!';
			//var spokenMsg = new SpeechSynthesisUtterance(message);
			//window.speechSynthesis.speak(spokenMsg);

			//sendSlackMessage('poolTabl3Empty #' + noMotionNotificationId);
			switch (noMotionNotificationId) {
				case 1:
					sendSlackMessage('The pool table is unused (' +
						Math.round(noMotionTime / 60) + ' mins)');
					break;
				case 2:
					sendSlackMessage('Pool table still unused (' +
						Math.round(noMotionTime / 60) + ' mins)');
					break;
			}
		}
	}

	window.addEventListener('load', init, false);
})();
