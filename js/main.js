(function () {
	var slackHookUri = 'https://hooks.slack.com/services/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';

	var motionThreshold = 5,
		timeThreshold = 10,

		intervalCheck = null,
		lastMotionDate = Date.now(),
		noMotionAnnouncedAt = 0;

	var $logger = $('#logger');

	function init() {
		$('#startbutton').click(function () {
			intervalCheck = startIntervalCheck();
			logMessage('Started checking for motion');
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
			.val(motionThreshold)
			.change(function () {
				var newVal = parseInt($(this).val());
				if (!newVal) return;

				motionThreshold = newVal;
				logMessage('Changed motion threshold to ' + motionThreshold);
			});

		$('#timeThreshold')
			.val(timeThreshold)
			.change(function () {
				var newVal = parseInt($(this).val());
				if (!newVal) return;

				timeThreshold = newVal;
				logMessage('Changed time threshold to ' + timeThreshold);
			});

		$('#slackHookUri')
			.val(slackHookUri)
			.change(function () {
				var newVal = $(this).val();
				if (!newVal) return;

				slackHookUri = newVal;
				logMessage('Changed Slack URI to ' + slackHookUri);
			});
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
						if (data.misMatchPercentage > motionThreshold) {
							logMessage('Motion detected. ' + percentage);

							lastMotionDate = Date.now();
						} else {
							logMessage('No motion detected.' + percentage);
							checkMotionLoop();
						}
					});
			}
		}, 1000);
	}

	function sendSlackMessage(message) {
		try {
			fetch(slackHookUri, {
				method: 'post',
				body: JSON.stringify({
					text: message
				})
			});
		} catch (err) {
			logMessage('No internet connectivity or incorrect Slack hook URI. Check console.');
			console.error(err);
		}
	}

	function checkMotionLoop() {
		var now = Date.now();
		var noMotionTime = Math.round((now - lastMotionDate) / 1000);
		var noMotionAnnouncedTime = Math.round((now - noMotionAnnouncedAt) / 1000);

		if (noMotionTime >= timeThreshold && noMotionAnnouncedTime >= timeThreshold) {
			noMotionAnnouncedAt = now;

			//var message = 'No motion in ' + noMotionTime + ' seconds!';
			//var spokenMsg = new SpeechSynthesisUtterance(message);
			//window.speechSynthesis.speak(spokenMsg);

			var message = 'No motion in ' + noMotionTime + ' seconds';

			sendSlackMessage(message);
			logMessage('Sent to Slack: ' + message);
		}
	}

	window.addEventListener('load', init, false);
})();
