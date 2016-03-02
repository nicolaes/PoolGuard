(function () {
	//var storage = chrome.storage.local;
	var config = {
		motionThreshold: 5,
		timeThreshold: 10,
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

	var timeThreshold = 10,

		noMotionNotificationId = 0,
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
				var diff = resemble(thisPicture)
					.compareTo(lastPicture)
					.ignoreColors()
					.onComplete(function (data) {
						var percentage = 'Percentage: ' + data.misMatchPercentage + '%';
						if (data.misMatchPercentage > storage.get('motionThreshold')) {
							logMessage('Motion detected. ' + percentage);
							lastMotionDate = Date.now();
							if (noMotionNotificationId > 0) {
								noMotionNotificationId = 0;
								sendSlackMessage('poolTabl3Reoccupied');
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

			sendSlackMessage('poolTabl3Empty #' + noMotionNotificationId);
		}
	}

	window.addEventListener('load', init, false);
})();
