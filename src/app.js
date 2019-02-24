/*global flyd, P, S, PS*/
// architecture http://meiosis.js.org/docs/toc.html
const { render, html } = lighterhtml;

var Session ={ 
	initialState: {

	},
	actions: function (update) {
		return {
			muteVideo: function (value) {
				update({ conditions: PS({ precipitations: value }) });
			},
			muteAudio: function (value) {
				update({ conditions: PS({ sky: value }) });
			},
			leaveRoom: function (value){

			}
		};
	}
}


function Session({state, actions}){
	var {muteVideo, muteAudio, leaveRoom} = actions
	return html`
<div>
	<nav id="nav-session" class="navbar navbar-default">
		<div class="container">
			<div class="navbar-header">
				<a class="navbar-brand" href="/">
					<img class="demo-logo" src="resources/images/openvidu_vert_white_bg_trans_cropped.png" /> getaroom</a>
				<button id="leave-room" type="button" class="btn btn-danger" onclick="aleaveRoom()">
					<span class="hidden-xs">Leave Room</span>
					<span class="hidden-sm hidden-md hidden-lg">Leave</span>
				</button>
				<form class="hidden-xs">
					<div class="input-group">
						<input type="text" class="form-control" placeholder="Some path" id="copy-input">
						<span class="input-group-btn">
							<button class="btn btn-default" type="button" id="copy-button" data-toggle="tooltip" data-placement="button" title="Copy to Clipboard">Share the URL</button>
						</span>
					</div>
				</form>
				<button id="mute-video" type="button" class="btn btn-primary float-right mute-button" onclick="muteVideo()">
					<span class="glyphicon glyphicon-facetime-video"></span>
					<span class="hidden-xs">Video</span>
				</button>
				<button id="mute-audio" type="button" class="btn btn-primary float-right mute-button" onclick="muteAudio()">
					<span class="glyphicon glyphicon-volume-up"></span>
					<span class="hidden-xs">Audio</span>
				</button>
			</div>
		</div>
	</nav>

	<div id="session" hidden>

		<div id="videos" class="row no-margin">
			<div id="publisher"></div>
		</div>
	</div>
</div>
	`
}

var begin = {
	initialState: {
		session: {
			on: false,
			connected: false,
			sessionId: null,

		}
	},
	actions: function (update) {
		return {
			joinRoom: function (value) {
				update({ session: PS({ on: true }) })
			},
		};
	}
}

function Begin ({state, actions}){
	return html`
	<div>
	<nav id="nav-join" class="navbar navbar-default">
		<div class="container">
			<div class="navbar-header">
				<a class="navbar-brand" href="/">
					<img class="demo-logo" src="resources/images/openvidu_vert_white_bg_trans_cropped.png" /> getaroom</a>
				<a class="navbar-brand nav-icon" href="https://github.com/OpenVidu/openvidu-tutorials/tree/master/openvidu-getaroom" title="GitHub Repository"
				 target="_blank">
					<i class="fa fa-github" aria-hidden="true"></i>
				</a>
				<a class="navbar-brand nav-icon" href="http://www.openvidu.io/docs/tutorials/openvidu-getaroom/" title="Documentation" target="_blank">
					<i class="fa fa-book" aria-hidden="true"></i>
				</a>
			</div>
		</div>
	</nav>
	<div id="join" class="row no-margin" hidden>
		<div id="img-div">
			<img src="resources/images/openvidu_grey_bg_transp_cropped.png" />
		</div>
		<div id="join-dialog" class="jumbotron vertical-center">
			<h1 class="arciform">Get a room</h1>
			<button type="button" class="btn btn-lg btn-success" onclick="joinRoom(); return false;">Go!</button>
		</div>
	</div>
	<footer class="footer">
		<div class="container">
			<div class="text-muted">OpenVidu © 2017</div>
			<a href="http://www.openvidu.io/" target="_blank">
				<img class="openvidu-logo" src="resources/images/openvidu_globe_bg_transp_cropped.png" />
			</a>
		</div>
		</footer>
</div>
	`
}


function all ({state, actions}){
	return html`
	
		
		<div id="main-container" class="container">
		
		
			${state.session.on? Session: Begin}

		
		</div>
		
	`
}

const VideoInsertService = {
	initial() {
		return {

		};
	},
	service(state){
		if (state.session.on){
			var { OV, sessionId } = state.session
			if (!sessionId) {
				// If the user is joining to a new room
				sessionId = randomString();
			}
			var path = (location.pathname.slice(-1) == "/" ? location.pathname : location.pathname + "/");
			window.history.pushState("", "", path + '#' + sessionId);
			initializeSessionView();
			var {OV} = state.session
			publisher = OV.initPublisher('publisher', {
				audioSource: undefined, // The source of audio. If undefined default audio input
				videoSource: undefined, // The source of video. If undefined default video input
				publishAudio: true,  	// Whether to start publishing with your audio unmuted or not
				publishVideo: true,  	// Whether to start publishing with your video enabled or not
				resolution: '640x480',  // The resolution of your video
				frameRate: 30,			// The frame rate of your video
				insertMode: 'APPEND',	// How the video is inserted in target element 'video-container'
				mirror: true       		// Whether to mirror your local video or not
			});
		}
	}
};

const update = m.stream();
const T = (x, f) => f(x);
const state = m.stream.scan(T, initialState(), update);
const element = document.getElementById("app");
states.map(view(update)).map(v => m.render(element, v));



window.addEventListener('load', function () {
	sessionId = window.location.hash.slice(1); // For 'https://myurl/#roomId', sessionId would be 'roomId'
	if (sessionId) {
		// The URL has a session id. Join the room right away
		console.log("Joining to room " + sessionId);
		showSessionHideJoin();
		joinRoom();
	} else {
		// The URL has not a session id. Show welcome page
		showJoinHideSession();
	}
});

window.addEventListener('beforeunload', function () {
	if (session) session.disconnect();
});


//////UTITLIES/////////////////////////////////////////////////////////////////////////////
function dropRepeatsWith(eq, s) {
	var prev;
	return flyd.combine(function (s, self) {
		if (!self.hasVal || !eq(s.val, prev)) {
			self(s.val);
			prev = s.val;
		}
	}, [s]);
}

function dropRepeats (s) {
	return dropRepeatsWith(strictEq, s);
};

var dropRepeatsWith = flyd.curryN(2, dropRepeatsWith);

function strictEq(a, b) {
	return a === b;
}