let audioContext;
let mediaRecorder;
let audioChunks = [];
let canvas;
let canvasCtx;
let shouldDrawWaveform = false;
let mediaStream;

document
  .getElementById("startRecording")
  .addEventListener("click", startRecording);
document
  .getElementById("stopRecording")
  .addEventListener("click", stopRecording);
document.getElementById("playAudio").addEventListener("click", playAudio);

function startRecording() {
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then(function (stream) {
      mediaStream = stream;
      shouldDrawWaveform = true;
      setupAudio(stream);
      audioChunks = [];
      mediaRecorder.start();
      document.getElementById("startRecording").disabled = true;
      document.getElementById("stopRecording").disabled = false;
    })
    .catch(function (err) {
      console.log("Error accessing microphone:", err);
    });
}

function stopRecording() {
  shouldDrawWaveform = false;
  mediaRecorder.stop();
  mediaStream.getTracks().forEach((track) => track.stop());
  document.getElementById("startRecording").disabled = false;
  document.getElementById("stopRecording").disabled = true;
}

function playAudio() {
  const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
  const audioUrl = URL.createObjectURL(audioBlob);
  document.getElementById("audioPlayer").src = audioUrl;
  document.getElementById("playAudio").disabled = false;
}

function setupAudio(stream) {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      audioChunks.push(event.data);
    }
  };

  canvas = document.getElementById("audioWaveform");
  canvasCtx = canvas.getContext("2d");

  canvasCtx.fillStyle = "rgb(255, 255, 255)";
  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

  function draw() {
    if (shouldDrawWaveform) {
      // Create an AnalyserNode to analyze the audio data
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      // Connect the AnalyserNode to the microphone input
      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);

      analyser.getByteTimeDomainData(dataArray);

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      canvasCtx.beginPath();
      canvasCtx.moveTo(0, canvas.height / 2);

      for (let i = 0; i < bufferLength; i++) {
        const x = (i / bufferLength) * canvas.width;
        const y =
          (dataArray[i] / 128) * (canvas.height / 2) + canvas.height / 2;
        canvasCtx.lineTo(x, y);
      }

      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.strokeStyle = "blue";
      canvasCtx.stroke();
    }

    requestAnimationFrame(draw);
  }

  draw();
}
