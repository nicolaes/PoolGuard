(function () {
	var slackHookUri = 'https://hooks.slack.com/services/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';

	var mismatchThreshold = 10,
		motionTimeThreshold = 5,

		intervalCheck = null,
		lastMotionDate = Date.now(),
		noMotionAnnouncedAt = 0;

	function init() {
		document.getElementById('startbutton').addEventListener('click', function (ev) {
			intervalCheck = startIntervalCheck();
			ev.preventDefault();
		}, false);

		document.getElementById('stopbutton').addEventListener('click', function (ev) {
			if (intervalCheck !== null) {
				clearInterval(intervalCheck);
				intervalCheck = null;
			}
			ev.preventDefault();
		}, false);
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
						if (data.misMatchPercentage > mismatchThreshold) {
							console.log('Motion detected. Percentage: ' + data.misMatchPercentage + '%');

							lastMotionDate = Date.now();
						} else {
							checkMotionLoop();
						}
					});
			}
		}, 1000);
	}

	function sendSlackMessage(message) {
		fetch(slackHookUri, {
			method: 'post',
			body: JSON.stringify({
				text: message
			})
		});
	}

	function checkMotionLoop() {
		var now = Date.now();
		var noMotionTime = Math.round((now - lastMotionDate) / 1000);
		var noMotionAnnouncedTime = Math.round((now - noMotionAnnouncedAt) / 1000);

		console.log('noMotionTime', noMotionTime);
		console.log('noMotionAnnouncedTime', noMotionAnnouncedTime);

		if (noMotionTime >= motionTimeThreshold && noMotionAnnouncedTime >= motionTimeThreshold) {
			noMotionAnnouncedAt = now;

			//var message = 'No motion in ' + noMotionTime + ' seconds!';
			//var spokenMsg = new SpeechSynthesisUtterance(message);
			//window.speechSynthesis.speak(spokenMsg);

			sendSlackMessage('POOL ROOM: No motion in ' + noMotionTime + ' seconds!');
		}
	}

	window.addEventListener('load', init, false);
})();
