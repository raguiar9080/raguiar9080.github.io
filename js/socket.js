import {Socket} from "phoenix"
import binarySocket from "./binarySocket"
import utils from "./utils"

/*the type=msgpack param is only added to distinguish this connection
 * from the phoenix live reload connection in the browser's network tab*/
let socket = new Socket("/socket", {params: {token: window.userUsername, type: "msgpack"}})

socket = binarySocket.convertToBinary(socket);
socket.connect();

export default socket;

$(document).ready(function() {
  var audioCtx;
  var canvas = document.querySelector('.visualizer');
  var canvasDelayInfo = document.querySelector('.streamDelaysInfo');
  var canvasDelay = document.querySelector('.streamDelays');
  var buttonRebootAudio = document.querySelector('.rebootAudio');
  var buttonStartAudio = document.querySelector('.startAudio');
  var canvasCtx = canvas ? canvas.getContext("2d") : null;
  var drawVisual;
  var drawDataArray;
  // StreamSources Vars
  var sources = [];
  var sourcesCurrentDelay = [0];
  var sourcesMaxDelay = [0];
  var sourcesStartTime = [0];
  // StreamProducer Vars
  var startTime = 0;
  var streamChannel = 0;
  // User Vars
  var sourcesDelay = [100];
  var MICRO_BUFF_SIZE = 2048;


  // Now that you are connected, you can join channels with a topic:
  let channel = socket.channel("room:lobby", {})
    let chatInput = document.querySelector("#chat-input")
    let messagesContainer = document.querySelector("#messages")

    if (chatInput) {
      chatInput.addEventListener("keypress", event => {
        if(event.keyCode === 13){
          channel.push("new_msg", {msg: chatInput.value, author: window.userUsername});
          chatInput.value = ""
        }
      });
    };

  channel.on("new_msg", function(data){
    if (messagesContainer) {
      let messageItem = document.createElement("li")
        var currentdate = new Date();
      var datetime = currentdate.getHours() + ":" + currentdate.getMinutes();

      messageItem.innerText = `[${datetime}](${data.author}) ${data.body}`;
      messagesContainer.appendChild(messageItem);
    }
  })

  channel.on("small_reply", function(data){
    if (audioCtx) {
      var channel = JSON.parse(data.body.channel);
      var clipPlayTime = JSON.parse(data.body.start_time);
      processAudioStream(Object.values(JSON.parse(data.body.data)), clipPlayTime, channel);
    }
  })

  channel.on("large_reply", function(data){
    if (audioCtx) {
      var channel = JSON.parse(data.body.channel);
      var clipPlayTime = JSON.parse(data.body.start_time);
      processAudioStream(Object.values(JSON.parse(data.body.data)), clipPlayTime, channel);
      // console.log("large reply: server responded with", data);
    }
  })

  channel.join()
    .receive("ok", resp => { console.log("Joined successfully", resp) })
    .receive("error", resp => { console.log("Unable to join", resp) });

  if (canvasDelay) {
    canvasDelay.oninput = function() {
      sourcesDelay[0] = parseInt(canvasDelay.value);
    };
    buttonRebootAudio.onclick = rebootAudio;
    buttonStartAudio.onclick = initializeAudio;
  };

  draw();

  function initializeAudio() {
    console.log("Audio is starting up...");
    if (!navigator.getUserMedia)
      navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

    if (navigator.getUserMedia){
      navigator.getUserMedia(
          {audio:true},
          function(stream) {
            audioCtx = new AudioContext();
            sources = [audioCtx.createBufferSource()];
            startMicrophone(stream);
            rebootAudio();
          },

          function(e) {
            alert('Error capturing audio.');
          }
          );
    }
    else { alert('getUserMedia not supported in this browser.'); }
  }

  function draw() {
    if (!canvas)
      return;

    drawVisual = requestAnimationFrame(draw);
    var data = new Float32Array(drawDataArray);
    var WIDTH = canvas.width;
    var HEIGHT = canvas.height;
    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
    canvasCtx.fillStyle = 'rgb(200, 200, 200)';
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

    canvasCtx.beginPath();

    var sliceWidth = WIDTH * 1.0 / data.length;
    var x = 0;

    for(var i = 0; i < data.length; i++) {
      var v = data[i];// / 128.0;
      var y = v * HEIGHT/2 + HEIGHT/2;

      if (i === 0) canvasCtx.moveTo(x, y);
      else canvasCtx.lineTo(x, y);

      x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height/2);
    canvasCtx.stroke();
    if (audioCtx) {
      var curDelay = utils.secondToMs(sourcesCurrentDelay[0]);
      var maxDelay = utils.secondToMs(sourcesMaxDelay[0]);
      canvasDelayInfo.innerHTML = (curDelay > 5000 ? "" : curDelay + "/" + maxDelay);
    }
  }

  function startMicrophone(stream){
    var microSource = audioCtx.createMediaStreamSource(stream);
    var microNode = audioCtx.createScriptProcessor(MICRO_BUFF_SIZE, 1, 1);
    microSource.connect(microNode);
    microNode.onaudioprocess = processMicrophoneBuffer;
    // due to some browser bugs, we can't set output channels to zero, so
    // we simply feed it to a unused analysernode
    let analyserNode = audioCtx.createAnalyser();
    microNode.connect(analyserNode);
  }

  function processAudioStream(dataArray, clipPlayTime, channel) {
    drawDataArray = dataArray;
    var clip = new Float32Array(dataArray);
    sourcesCurrentDelay[channel] = audioCtx.currentTime - clipPlayTime - sourcesStartTime[channel];
    if (sourcesCurrentDelay[channel] > sourcesMaxDelay[channel]) {
      sourcesMaxDelay[channel] = sourcesCurrentDelay[channel];
    }

    sources[channel] = audioCtx.createBufferSource();
    var buffer = audioCtx.createBuffer(1, clip.length, audioCtx.sampleRate);
    buffer.copyToChannel(clip, 0, 0);
    sources[channel].buffer = buffer;
    sources[channel].connect(audioCtx.destination);
    sources[channel].start(sourcesStartTime[channel] + clipPlayTime + utils.msToSecond(sourcesDelay[channel]));
    // console.log("Delay: " + (clipStartTime - sourcesStartTime[0] - audioCtx.currentTime));
    // console.log("small reply: server responded with", data);
  }

  function processMicrophoneBuffer(audioProcessingEvent) {
    //console.log("Processing micro");
    var inputBuffer = audioProcessingEvent.inputBuffer;
    for (var ch = 0; ch < inputBuffer.numberOfChannels; ch++) {
      var microData = JSON.stringify(audioProcessingEvent.inputBuffer.getChannelData(ch));
      channel.push("small", {data: microData,
        channel: JSON.stringify(streamChannel),
        time: JSON.stringify(new Date().getTime()),
        start_time: JSON.stringify(audioCtx.currentTime - startTime)});
    }
  }

  function rebootAudio() {
    if (audioCtx) {
      startTime = audioCtx.currentTime;
      sourcesStartTime = [audioCtx.currentTime];
    }
    sourcesCurrentDelay = [0];
    sourcesMaxDelay = [0];
    try { sources[0].stop() } catch(e) {};
  }
});
