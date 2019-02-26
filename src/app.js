
/*global flyd, P, S, PS, D*/
// P is top level assign, PS is embedded property, {prop: D} is for delete
// architecture http://meiosis.js.org/docs/toc.html
// update as parameter is flyd.stream(), doing flyd.stream(values) will trigger all other functions that are "listening" to state values
// whats listening to flyd.stream()/update is basically reduce function that takes the "event" value and reduces it into initial state object, this "streamer" is assigned to "states variable", if you want to see the current state, run states()
// next what happens there's another listener of "states" variable that will rerun "App" causing values to reevaluate
// there're services, and service related code that's entirely unused, but is generally meant for...
// ...things that should run when state has updated (storing state in web storage, or for example P({greetings: state.othername + "chatting with" state.name}) although you can do it in...
// ...html`${state.othername + "chatting with" state.name}
const { render, html } = lighterhtml;

var OV = new OpenVidu();

var OPENVIDU_SERVER_URL = "https://" + location.hostname + ":4443";
var OPENVIDU_SERVER_SECRET = "MY_SECRET";
var name = Math.random().toString(36)
var session = OV.initSession();
var publisher = null

//object that is used to evaluate all expressions in render- function by name of App, and is updated by events
function initialState() {
	var state = {
		sessionId: "",
		OV: OV,
		session: session,
		chat: [],
		token: false,
		name: name,
		avatar: "",
		otherName: "",
		otherAvatar: "",
		message: "",
		videoSwitch: true,
		micSwitch: true,
		videoChoice: true,
		chatSwitch: true,
		screenSwitch: false,
		videoDevices: null,
		splitChat: window.matchMedia("(max-width: 639px)").matches
	}

	return P({},
		state,
		services
			.map(s => s.initial(state))
			.reduce((a, x) => {
				return P(a, x)
			})
	)
}
//this can be ignored, alont with everying services/service related
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
	tokenService,
]

//the glue that puts it all together////////////////////////////////////////////////
const service = state => services
	.map(s => s.service)
	.reduce((x, f) => P(x, f(x)), state);

var update = flyd.stream();
const states = flyd.scan(P, initialState(), update)
	.map((state) => {
		return service(state)
	})
states.map(view)
function view(state) {
	const element = document.getElementById("app");
	render(element, () => App(state, actions(update)))
}


OV.getDevices().then(x => {
	update({ videoDevices: x.filter(x => x.kind == "videoinput") })
})

$(document).ready(function () {
	getToken("asdf", name).then(() => {
		update({ token: true })
	})
});
window.onbeforeunload = function () {
	if (session) session.disconnect();
};

/////////////////////EVENTS///////////////////////////////////
//methods/functions that generally run update function to update state above, that triggers rerun of App
//update method is the first stream, the second one determines state, and third reruns App (all 3 of these streams is above)
function actions(update) {
	return {
		toggleVideo() {
			var state = states() //returns current state
			var val = !state.videoSwitch
			update({ videoSwitch: val });
			publisher.publishVideo(val);
		},
		toggleMic() {
			var state = states()
			var val = !state.micSwitch
			update({ micSwitch: val });
			publisher.publishAudio(val)
		},
		toggleChat() {
			var state = states()
			var val = !state.chatSwitch
			update({ chatSwitch: val });
		},
		toggleScreen() {
			var state = states()
			var val = !state.screenSwitch
			update({ screenSwitch: val });
			publish()
		},
		chooseVideo() {
			var state = states()
			var val = !state.videoChoice
			update({ videoChoice: val });
		},
		leaveRoom() {
			session.disconnect();
		},
		name(ev) {
			update({ name: ev.target.value })
		},
		//updates chat array from event listener
		sendMessage(ev) {
			ev.preventDefault()
			var old = states()
			if (old.message == "") {
				return
			}
			session.signal({
				data: old.message,  // Any string (optional)
				to: [],                     // Array of Connection objects (optional. Broadcast to everyone if empty)
				type: 'chat'             // The type of message (optional)
			})
				.catch(error => {
					update(old)
					console.warn("message couldn't be delivered")
				});
			update({ message: "" })
		},
		updateMessage(ev) {
			console.log(111111, ev, ev.target.value)
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
	var subscriber = session.subscribe(event.stream, undefined);
	var videoElement = document.getElementById("other-video")
	subscriber.addVideoElement(videoElement);
});

session.on("connectionCreated", event => {
	var nick = JSON.parse(event.connection.data).nickname
	var avatar = JSON.parse(event.connection.data).avatar
	nick != states().name ? update({ otherName: JSON.parse(event.connection.data).nickname }) : null
	avatar != states().avatar ? update({ otherAvatar: JSON.parse(event.connection.data).avatar }) : null
})

var x = window.matchMedia("(max-width: 639px)")
x.addListener(x => update({ splitChat: x.matches }))
////VIEWS///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// https://www.bootdey.com/snippets/view/Chat-room-with-right-list
function Message(state, message) {
	//your own message on right
	var { name, avatar, otherAvatar } = state
	var mine = name == message.nickname
	var aRight = mine ? "chat-message right" : "chat-message left"
	var avatar = mine ? avatar : otherAvatar
	return html`
<div class=${aRight}>
	<img class="message-avatar" src=${avatar} alt="">
	<div class="message">
		<!-- <a class="message-author" href="#"> Michael Smith </a>
		<span class="message-date"> Mon Jan 26 2015 - 18:39:23 </span> -->
		<span class="message-content">
			${{ html: anchorme(message.message) }}
		</span>
	</div>
</div>
	`
}


function Chat(state, actions) {
	var { sendMessage, updateMessage } = actions
	if (state.splitChat) {
		return html`
<div class="" style="width: 100%">
	<div class="ibox chat-view" style="max-width: 40%; ; display:inline-block; width: 800px;">
		<div class="ibox-content">
			<div class="row">
				<div class="col-lg-12 ">
					<div class="chat-discussion">
						${state.chat.map(x => Message(state, x))}
					</div>

				</div>

			</div>
		</div>
	</div>
	<div class="align-top" style="max-width: 45%; display:inline-block;  vertical-align: super;">
		<div class="col-lg-12">
			<div class="chat-message-form">
				<div class="form-group">
					<form onsubmit=${sendMessage}>
						<textarea value=${state.message} oninput=${updateMessage} class="form-control message-input"
							name="message" placeholder="Enter message text and press enter"></textarea>
						<button type="submit" class="btn btn-primary">Send
						</button>
					</form>
				</div>
			</div>
		</div>
	</div>
</div>
		`
	}
	return html`
<div class="ibox chat-view">
	<div class="ibox-content">
		<div class="row">
			<div class="col-lg-12 ">
				<div class="chat-discussion">
					${state.chat.map(x => Message(state, x))}
				</div>
			</div>
		</div>
		<div class="row">
			<div class="col-lg-12">
				<div class="chat-message-form">
					<div class="form-group">
						<form onsubmit=${sendMessage}>
							<textarea value=${state.message} oninput=${updateMessage} class="form-control message-input"
								name="message" placeholder="Enter message text and press enter"></textarea>
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

function App(state, actions) {
	var { toggleVideo, toggleMic, toggleChat, chooseVideo, toggleScreen, leaveRoom, name } = actions
	var { screenSwitch, videoChoice, videoSwitch, micSwitch, chatSwitch } = state
	// for rendering state
	// var json = P({}, state, { OV: D }, { session: D })
	// < pre > ${ JSON.stringify(json, null, 4)}</pre >
	return html`
<div>
	<div> ASDF</div>
	<div>
		<div class="">
			<div class=${chatSwitch ? "grid" : "" }>
				<header>
					<button onclick=${toggleScreen} type="button" class="btn btn-primary float-right mute-button">
						<i class="material-icons">${screenSwitch ? "screen_share" : "stop_screen_share"}</i>
					</button>
					<button onclick=${chooseVideo} type="button" class="btn btn-primary float-right mute-button">
						<i class="material-icons">${videoChoice ? "camera_front" : "camera_rear"}</i>

					</button>

					<button onclick=${toggleVideo} type="button" class="btn btn-primary float-right mute-button">
						<i class="material-icons">${videoSwitch ? "videocam" : "videocam_off"}</i>
					</button>

					<button onclick=${toggleMic} type="button" class="btn btn-primary float-right mute-button">
						<i class="material-icons">${micSwitch ? "mic" : "mic_off"}</i>
					</button>

					<button onclick=${toggleChat} type="button" class="btn btn-primary float-right mute-button">
						<i class="material-icons">${chatSwitch ? "speaker_notes" : "speaker_notes_off"}</i>
					</button>
				</header>

				<div id="main-video" class="media">
					<video id="video" muted class=""></video>
					<video id="other-video" class=""></video>
				</div>
				${chatSwitch ? Chat(state, actions) : null}
			</div>
			<button onclick=${leaveRoom} type="button" class="btn btn-primary float-right mute-button">Leave
				Room</button>
		</div>
		</video>
	</div>
</div>
	`
}

/////////////////UTILITIES

//https://openvidu.io/api/openvidu-browser/interfaces/publisherproperties.html#publishvideo
function publish(type) {
	var { screenSwitch, videoSwitch, micSwitch, videoChoice, videoDevices } = states()
	var pb = {
		audioSource: undefined, // The source of audio. If undefined default microphone
		videoSource: undefined, // The source of video. If undefined default webcam
		publishAudio: micSwitch,  	// Whether you want to start publishing with your audio unmuted or not
		publishVideo: videoSwitch,  	// Whether you want to start publishing with your video enabled or not
		// resolution: '640x480',  // The resolution of your video
		frameRate: 30,			// The frame rate of your video
		// insertMode: 'APPEND',	// How the video is inserted in the target element 'video-container'	
		mirror: true       	// Whether to mirror your local video or not+
	}
	var typeToChoose = !videoChoice
	if (videoDevices.length >= 2 && typeToChoose) {
		pb.videoSource = videoDevices[typeToChoose].deviceId
	}
	if (screenSwitch) {
		pb.videoSource = "screen"
		pb.mirror = false
	}
	if (publisher != null) {
		session.unpublish(publisher)
	}
	var videoElement = document.getElementById("video")
	var pub = OV.initPublisher(undefined, pb);
	publisher = pub
	pub.addVideoElement(videoElement);
	session.publish(pub);
	return pub
}

function getToken(id, name, sessionName = "asdf") {
	return process(id).then(token => {
		// Connect with the token
		session.connect(token, { nickname: name, avatar: states().avatar })
			.then(() => {
				publisher = publish()
				session.publish(publisher);
			})
			.catch(error => {
				console.error('There was an error connecting to the session:', error.code, error.message);
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

