"use strict"

var PeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
var IceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;
var SessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;
navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;

var pc;
var localStream;
var servers = {
  iceServers: [
       {urls: 'stun:120.0.0.1:1212'}
      ]
};

function joinRoom() {
  navigator.getUserMedia(
    { audio: true, video: true },
    gotStream,
    function(error) {
      console.log(error)
    }
  );
}

function leaveRoom() {
  localStream.getAudioTracks()[0].stop();
  localStream.getVideoTracks()[0].stop();
  document.getElementById("localVideo").src = "";
  pc.close();
}


function gotStream(stream) {
  document.getElementById("localVideo").src = URL.createObjectURL(stream);
  localStream = stream;
  pc = new PeerConnection(servers);
  pc.addStream(stream);
  pc.onicecandidate = gotIceCandidate;
  pc.onaddstream = gotRemoteStream;
}

function pause() {
  localStream.getVideoTracks()[0].enabled = false;
  localStream.getAudioTracks()[0].enabled = false;
}

function resume() {
  localStream.getVideoTracks()[0].enabled = true;
  localStream.getAudioTracks()[0].enabled = true;
}

function pauseVideo() {
  localStream.getVideoTracks()[0].enabled = false;
}

function resumeVideo() {
  localStream.getVideoTracks()[0].enabled = true;
}

function mute() {
  localStream.getAudioTracks()[0].enabled = false;
}

function unMute() {
  localStream.getAudioTracks()[0].enabled = true;
}

function createOffer() {
  if(document.getElementById("localVideo").src != ""){
    pc.createOffer(
      gotLocalDescription,
      function(error) { console.log(error) },
      { 'mandatory': { 'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true } }
    );
  }
}

function createAnswer() {
  pc.createAnswer(
    gotLocalDescription,
    function(error) { console.log(error) },
    { 'mandatory': { 'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true } }
  );
}

function gotLocalDescription(description){
  pc.setLocalDescription(description);
  sendMessage(description);
}

function gotIceCandidate(event){
  if (event.candidate) {
    sendMessage({
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate
    });
  }
}

function gotRemoteStream(event){
  document.getElementById("remoteVideo").src = URL.createObjectURL(event.stream);
}

var socket = io.connect('http://localhost:1222');

function sendMessage(message){
  socket.emit('message', message);
}

socket.on('message', function (message){
  if (message.type === 'offer') {
    pc.setRemoteDescription(new SessionDescription(message));
    createAnswer();
  }
  else if (message.type === 'answer') {
    pc.setRemoteDescription(new SessionDescription(message));
  }
  else if (message.type === 'candidate') {
    var candidate = new IceCandidate({sdpMLineIndex: message.label, candidate: message.candidate});
    pc.addIceCandidate(candidate);
  }
});
