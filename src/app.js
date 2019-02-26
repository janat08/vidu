
/*global flyd, P, S, PS, D*/
// architecture http://meiosis.js.org/docs/toc.html
const { render, html } = lighterhtml;

var OV = new OpenVidu();
// var OPENVIDU_SERVER_URL = "https://pluton.ucsturkey.com:4443";
// var OPENVIDU_SERVER_SECRET = "p1ssw0rd";

var OPENVIDU_SERVER_URL = "https://" + location.hostname + ":4443";
var OPENVIDU_SERVER_SECRET = "MY_SECRET";
var name = Math.random().toString(36)
var session = OV.initSession();

function initialState() {
		var state = {
			on: false,
			connected: false,
			sessionId: "asdf",
			OV: OV,
			session: session,
			chat: [],
			token: false,
			name: name,
			otherName: "",
			message: "",
		}

		return P({},
			state,
			services
				.map(s => s.initial(state))
				// .reduce(R.merge, {})
				.reduce((a, x)=>{
					return P(a,x)
				})	
			)
}

//////EVENTS
window.addEventListener('beforeunload', function () {
	if (session) session.disconnect();
});

function actions (update) {
		return {
			muteVideo: function (value) {
				update({ conditions: PS({ precipitations: value }) });
			},
			muteAudio: function (value) {
				update({ conditions: PS({ sky: value }) });
			},
			leaveRoom: function (value){

			},
			name (ev){
				update({name: ev.target.value})
			},
			//updates chat array from event listener
			sendMessage(ev) {
				ev.preventDefault()
				var old = states()
				session.signal({
					data: old.message,  // Any string (optional)
					to: [],                     // Array of Connection objects (optional. Broadcast to everyone if empty)
					type: 'chat'             // The type of message (optional)
				})
					.catch(error => {
						update(old)
						console.log("message couldn't be delivered")
					});
				update({ message: ""})
			},
			updateMessage(ev){
				update({ message: ev.target.value })
			}
		};
}

session.on('signal:chat', (event) => {
	var state = states()
	update({ chat: [...state.chat, { message: event.data, ...JSON.parse(event.from.data) }] })
});

session.on('streamCreated', event => {
	// Subscribe to the Stream to receive it. HTML video will be appended to element with 'video-container' id
	setTimeout(()=>{ var subscriber = session.subscribe(event.stream, 'video-container');

	// When the HTML video has been appended to DOM...
	subscriber.on('videoElementCreated', event => {
		console.log(1111111111111111111111111131111111111111111111113)
		// Add a new <p> element for the user's nickname just below its video
		// appendUserData(event.element, subscriber.stream.connection);
	});
}, 1000)
});

// On every Stream destroyed...
session.on('streamDestroyed', event => {

	// Delete the HTML element with the user's nickname. HTML videos are automatically removed from DOM
	// removeUserData(event.stream.connection);
});

session.on("connectionCreated", event => {
	var nick = JSON.parse(event.connection.data).nickname
	nick != states().name ? update({ otherName: JSON.parse(event.connection.data).nickname }) : null
})

////VIEWS///////////////////
// http://www.prepbootstrap.com/bootstrap-template/dropdown-chat

// https://bootsnipp.com/snippets/y8e4W
function Message ({name}, message){
	//your own message on right
	var mine = name == message.nickname
	var aRight = mine ? "chat-message right" :"chat-message left"

	return html`
											<div class=${aRight}>
												<img class="message-avatar" src="https://bootdey.com/img/Content/avatar/avatar1.png" alt="">
												<div class="message">
													<!-- <a class="message-author" href="#"> Michael Smith </a>
													<span class="message-date"> Mon Jan 26 2015 - 18:39:23 </span> -->
													<span class="message-content">
														${message.message}
													</span>
												</div>
												</div>
	`
}


function Chat(state,actions){
	var {sendMessage, updateMessage} = actions
	return html`


			<div class="ibox chat-view">

				<div class="ibox-content">
					<div class="row">
						<div class="col-lg-3 ">
							<div class="chat-discussion">
								${state.chat.map(x=>Message(state,x))}
							</div>

						</div>

					</div>
					<div class="row">
						<div class="col-lg-12">
							<div class="chat-message-form">
								<div class="form-group">
									<form onsubmit=${sendMessage}>
									<textarea value=${state.message} onkeydown=${updateMessage} class="form-control message-input" name="message" placeholder="Enter message text and press enter"></textarea>
									<button type="submit" class="btn btn-primary">Send
										</button>
										</form>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>




	`
}

function App(state, actions){
	var {muteVideo, muteAudio, leaveRoom, name} = actions
	var json = P(state, {OV: D}, {session: D})	
	return html`
	<div>
	<div> ASDF</div>
<div>

<div class="container">

<div class="row">
	<!-- <header>
	<button id="mute-video" type="button" class="btn btn-primary float-right mute-button" onclick=${()=> muteVideo()}>
		<span class="glyphicon glyphicon-facetime-video"></span>
		<span class="hidden-xs">Video</span>
	</button>
	
	<button id="mute-audio" type="button" class="btn btn-primary float-right mute-button" onclick="muteAudio()">
		<i class="fa fa-microphone-slash"></i>
		<i class="fa fa-microphone"></i>
	</button>
	
	<i class="material-icons">speaker_notes_off</i>
	<i class="material-icons">speaker_notes</i>
	
	<i class="material-icons">mic_off</i>
	<i class="material-icons">mic</i>
	
	<i class="material-icons">videocam_off</i>
	<i class="material-icons">videocam</i>
	
	<i class="material-icons">screen_share</i>
	<i class="material-icons">stop_screen_share</i>
	
	<i class="material-icons">camera_front</i>
	<i class="material-icons">camera_rear</i>
	</header> -->
	<!-- <div class="embed-responsive embed-responsive-16by9">
<div id="main-video" class="embed-responsive-item green">
				<div id="video-container" class="blue">
					</div>
</div>
</div> -->
<div class="col-sm"> asdf</div>

<div class="col-sm"> ${Chat(state, actions)}</div>
</div>
	<pre>${JSON.stringify(state, null, 4)}</pre>

</div>
</div>
</div>
	`
}


const tokenService = {
	initial() {
		return {
		};
	},
	service(state) {
		return {}
	}
};


const services = [
	// VideoInsertService,
	tokenService,
]
const service = state => services
	.map(s => s.service)
	.reduce((x, f) => P(x, f(x)), state);

const update = flyd.stream();
window.update =update
const states = flyd.scan(P, initialState(), update)
	.map((state)=>{
		return service(state)
	})
states.map(view)
window.states = states

function view (state) {
	const element = document.getElementById("app");
	render(element, () => App(state, actions(update)))
}



function getToken(id, name, sessionName = "asdf"){

	return process(id).then(token => {

		// Connect with the token
		session.connect(token, { nickname: name })
			.then(() => {

				// --- 5) Set page layout for active call ---

				// document.getElementById('session-title').innerText = mySessionId;
				// document.getElementById('join').style.display = 'none';
				// document.getElementById('session').style.display = 'block';

				// --- 6) Get your own camera stream with the desired properties ---

				// var publisher = OV.initPublisher('main-video', {
				// 	audioSource: undefined, // The source of audio. If undefined default microphone
				// 	videoSource: undefined, // The source of video. If undefined default webcam
				// 	publishAudio: true,  	// Whether you want to start publishing with your audio unmuted or not
				// 	publishVideo: true,  	// Whether you want to start publishing with your video enabled or not
				// 	resolution: '640x480',  // The resolution of your video
				// 	frameRate: 30,			// The frame rate of your video
				// 	insertMode: 'APPEND',	// How the video is inserted in the target element 'video-container'	
				// 	mirror: false       	// Whether to mirror your local video or not
				// });
				// var publisher = OV.initPublisher("main-video", { 
				// 	videoSource: "screen",
				// 	resolution: '640x480',
				// 	publishAudio: false,
				//  });


				// --- 7) Specify the actions when events take place in our publisher ---

				// When our HTML video has been added to DOM...
				publisher.on('videoElementCreated', function (event) {
					// initMainVideo(event.element, myUserName);
					// appendUserData(event.element, myUserName);
				});

				// // --- 8) Publish your stream ---

				session.publish(publisher);
			})
			.catch(error => {
				console.log('There was an error connecting to the session:', error.code, error.message);
			});
	});
}

function process(mySessionId) {

	function createSession(sessionId) { // See https://openvidu.io/docs/reference-docs/REST-API/#post-apisessions
		return new Promise((resolve, reject) => {
			$.ajax({
				type: "POST",
				url: OPENVIDU_SERVER_URL + "/api/sessions",
				data: JSON.stringify({ customSessionId: sessionId }),
				headers: {
					"Authorization": "Basic " + btoa("OPENVIDUAPP:" + OPENVIDU_SERVER_SECRET),
					"Content-Type": "application/json"
				},
				success: response => resolve(response.id),
				error: (error) => {
					if (error.status === 409) {
						resolve(sessionId);
					} else {
						console.warn('No connection to OpenVidu Server. This may be a certificate error at ' + OPENVIDU_SERVER_URL);
						if (window.confirm('No connection to OpenVidu Server. This may be a certificate error at \"' + OPENVIDU_SERVER_URL + '\"\n\nClick OK to navigate and accept it. ' +
							'If no certificate warning is shown, then check that your OpenVidu Server is up and running at "' + OPENVIDU_SERVER_URL + '"')) {
							location.assign(OPENVIDU_SERVER_URL + '/accept-certificate');
						}
					}
				}
			});
		});
	}

	function createToken(sessionId) { // See https://openvidu.io/docs/reference-docs/REST-API/#post-apitokens
		return new Promise((resolve, reject) => {
			$.ajax({
				type: "POST",
				url: OPENVIDU_SERVER_URL + "/api/tokens",
				data: JSON.stringify({ session: sessionId }),
				headers: {
					"Authorization": "Basic " + btoa("OPENVIDUAPP:" + OPENVIDU_SERVER_SECRET),
					"Content-Type": "application/json"
				},
				success: response => resolve(response.token),
				error: error => reject(error)
			});
		});
	}
	return createSession(mySessionId).then(sessionId => createToken(sessionId))
}
function initMainVideo(videoElement, userData) {
	document.querySelector('#main-video video').srcObject = videoElement.srcObject;
	document.querySelector('#main-video p').innerHTML = userData;
	document.querySelector('#main-video video')['muted'] = true;
}
function appendUserData(videoElement, connection) {
	var userData;
	var nodeId;
	if (typeof connection === "string") {
		userData = connection;
		nodeId = connection;
	} else {
		userData = JSON.parse(connection.data).clientData;
		nodeId = connection.connectionId;
	}
	var dataNode = document.createElement('div');
	dataNode.className = "data-node";
	dataNode.id = "data-" + nodeId;
	dataNode.innerHTML = "<p>" + userData + "</p>";
	videoElement.parentNode.insertBefore(dataNode, videoElement.nextSibling);
	// addClickListener(videoElement, userData);
}

function removeUserData(connection) {
	var dataNode = document.getElementById("data-" + connection.connectionId);
	dataNode.parentNode.removeChild(dataNode);
}

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



$(document).ready(function () {
	getToken("asdf", name).then(() => {
		update({ token: true })
	})
});
