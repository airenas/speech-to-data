import Clip from './clipboard'
import PCM from './pcm-to-wav'
import AudioResampler from './resampler'
import { Config, RTTranscriber } from './transcriber'
import Line from './gui/line'
import Lines from './gui/lines'

const version = process.env.BUILD_VERSION
console.log(`Version: ${version}`)

window.addEventListener('error', function (event) {
  console.error('An error occurred:', event.error.message)
})

document.addEventListener('DOMContentLoaded', function () {
  const divElement = document.getElementById('transcriber')
  const kaldiUrl = (divElement.getAttribute('kaldi_url') ?? '').trim().replace(/[/]*$/g, '')

  const pageData = {}
  pageData.recording = false
  pageData.startButton = document.getElementById('start-button')
  pageData.stopButton = document.getElementById('stop-button')
  pageData.copyButton = document.getElementById('copy-button')
  pageData.clearButton = document.getElementById('clear-button')
  pageData.source = null
  pageData.source = null
  pageData.transcriberReady = false
  pageData.transcriberWorking = false
  pageData.clearTimeout = null

  pageData.res = []
  pageData.partials = ''
  pageData.skip = 0
  pageData.recordAreaContainer = new Lines(document.getElementById('record-area-container'))
  pageData.recordArea = createOrReturnDiv(pageData, pageData.recordArea)

  const doUpper = true
  const doPrependSpace = true
  pageData.workers = 0

  const addMsg = (isError, msg) => {
    if (isError) {
      console.error(msg)
    } else {
      console.info(msg)
    }
  }

  const cfg = new Config()
  cfg.server = kaldiUrl + '/speech'
  cfg.statusServer = kaldiUrl + '/status'
  cfg.sampleRate = 16000
  cfg.onPartialResults = (data) => {
    console.log('onPartialResults ' + data)
    if (data) {
      const hypText = prettyfyHyp(data[0].transcript, doUpper, doPrependSpace)
      console.log(hypText)
      pageData.partials = hypText
    }
    updateRes(pageData)
  }
  cfg.onResults = (data) => {
    console.log('onResults ' + data)
    if (data) {
      const hypText = prettyfyHyp(data[0].transcript, doUpper, doPrependSpace)
      console.log(hypText)
      pageData.res.push(hypText)
      pageData.partials = ''
    }
    updateRes(pageData)
  }
  cfg.onEvent = (e, data) => {
    // console.log("onEvent " + data);
    // infos.push({err:false, msg: e})
    // updateInfo(infoArea, infos)
  }
  cfg.onServerStatus = (data) => {
    pageData.workers = data.num_workers_available
    console.log('onStatusEvent ' + pageData.workers)
    addMsg(false, `Workers available: ${pageData.workers}`)
    updateComponents(pageData)
  }
  cfg.onReadyForSpeech = () => {
    pageData.transcriberReady = true
    pageData.transcriberWorking = true
    addMsg(false, 'Ready for speech')
  }
  cfg.onEndOfSpeech = () => {
    pageData.transcriberReady = false
    pageData.transcriberWorking = false
    addMsg(false, 'Stop speech')
    stop(pageData)
  }
  cfg.onEndOfSession = () => {
    pageData.transcriberReady = false
    pageData.transcriberWorking = false
    addMsg(false, 'Stop speech session')
    stop(pageData)
  }
  cfg.onError = (et, data) => {
    pageData.transcriberReady = false
    pageData.transcriberWorking = false
    addMsg(true, `Error ${et}`)
    stop(pageData)
  }

  addMsg(false, `Kaldi URL: ${cfg.server}`)
  addMsg(false, 'Waiting for server ready ...')

  pageData.transcriber = new RTTranscriber(cfg)

  pageData.canvas = document.getElementById('waveform');
  pageData.canvasCtx = pageData.canvas.getContext('2d');

  updateComponents(pageData)

  pageData.copyButton.addEventListener('click', async function () {
    console.log('copy')
    copyToClipboard(pageData)
  })

  pageData.clearButton.addEventListener('click', async function () {
    console.log('clear')
    clear(pageData)
  })

  pageData.startButton.addEventListener('click', async function () {
    console.log('start')
    try {
      pageData.recordArea = createOrReturnDiv(pageData, pageData.recordArea)
      pageData.res = []
      pageData.skip = 0
      pageData.audio = []
      if (!pageData.audioContext) {
        pageData.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      }

      if (!pageData.stream) {
        const constraints = {
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            sampleSize: 16,
            echoCancellation: true,
            autoGainControl: true,
            noiseSuppression: true
          },
          video: false,
        };
        pageData.stream = await navigator.mediaDevices.getUserMedia(constraints);
      }

      pageData.source = pageData.audioContext.createMediaStreamSource(pageData.stream);

      pageData.analyser = pageData.audioContext.createAnalyser();
      pageData.analyser.fftSize = 512;
      const bufferLength = pageData.analyser.frequencyBinCount;
      pageData.dataArray = new Uint8Array(bufferLength);
      pageData.source.connect(pageData.analyser);

      const scriptPath = new URL('audio-processor.js', import.meta.url)
      await pageData.audioContext.audioWorklet.addModule(scriptPath.href)
      pageData.workletNode = new AudioWorkletNode(pageData.audioContext, 'recorder-audio-processor', { processorOptions: { sampleRate: pageData.audioContext.sampleRate, bufferInSec: 0.25 } })

      pageData.source.connect(pageData.workletNode)
      const resampler = new AudioResampler(pageData.audioContext.sampleRate, cfg.sampleRate)
      pageData.sampleRate = cfg.sampleRate
      console.log(`sampleRate: ${pageData.audioContext.sampleRate}, targetRate: ${cfg.sampleRate}`);
      let initialized = false

      pageData.workletNode.port.onmessage = (event) => {
        console.log('Received worklet event')
        if (event.data.type === 'audioData') {
          const buffer = event.data.data
          // console.log(`Received audio data: ${buffer}`)
          if (buffer.length > 0 && pageData.transcriberReady) {
            const pcmData = resampler.downsampleAndConvertToPCM(buffer)
            pageData.audio.push(pcmData);
            pageData.transcriber.sendAudio(pcmData)
          }
          if (!pageData.transcriberReady && !initialized) {
            initialized = true
            pageData.partials = ''
            pageData.transcriber.init()
            updateRes(pageData)
          }
        }
      }

      pageData.recording = true
      updateComponents(pageData)
      draw(pageData)
    } catch (error) {
      console.error(error)
      addMsg(true, `Can't start recording`)
      stop(pageData)
    }
  })

  pageData.stopButton.addEventListener('click', function () {
    console.log('stop')
    stop(pageData)
  })
})

function createOrReturnDiv(pageData, recordArea) {
  if (recordArea && recordArea.text().length === 0 && recordArea.audio === null) {
    return recordArea
  }

  const line = new Line();
  pageData.recordAreaContainer.add(line)
  line.div.txt.addEventListener('focus', function (event) {
    console.log('on focus')
    if (line.audio) {
      assignBlobToAudio(line.audio)
    } else {
      assignBlobToAudio(null)
    }
  });
  return line
}

function draw(pageData) {
  pageData.animationId = requestAnimationFrame(function () { draw(pageData); });
  pageData.analyser.getByteFrequencyData(pageData.dataArray);
  drawForm(pageData);
}

function drawForm(pageData) {
  pageData.canvasCtx.clearRect(0, 0, pageData.canvas.width, pageData.canvas.height);

  const barWidth = (pageData.canvas.width / pageData.dataArray.length) * 2;
  let barHeight;
  let x = 0;

  pageData.canvasCtx.fillStyle = 'white';
  for (let i = 0; i < pageData.dataArray.length; i++) {
    barHeight = pageData.dataArray[i];

    //pageData.canvasCtx.fillStyle = 'rgb(' + (barHeight + 100) + ',50,50)';
    pageData.canvasCtx.fillRect(x, pageData.canvas.height - barHeight / 2, barWidth, barHeight / 2);

    x += barWidth + 1;
  }
}

function stop(pageData) {
  pageData.recording = false
  pageData.workletNode.disconnect()
  pageData.source.disconnect()
  stopStream(pageData)
  cancelAnimationFrame(pageData.animationId)
  if (pageData.transcriberReady) {
    pageData.transcriberReady = false
    pageData.transcriber.stopAudio()
  }

  // if (pageData.partials) {
  //   pageData.res.push(pageData.partials)
  //   pageData.partials = ''
  //   updateRes(pageData)
  // }
  updateComponents(pageData)
  prepareAudio(pageData)
};

function stopStream(pageData) {
  if (pageData.stream) {
    pageData.stream.getTracks().forEach(track => track.stop());
    pageData.stream = null
  }
};

function prepareAudio(pageData) {
  if (pageData.audio) {
    const allPcmData = pageData.audio.reduce((accumulator, current) => {
      return new Float32Array([...accumulator, ...current]);
    }, new Float32Array());
    const wav = new PCM(pageData.sampleRate).encodeWAV(allPcmData)
    const wavBlob = new Blob([wav], { type: 'audio/wav' });
    const blobUrl = URL.createObjectURL(wavBlob);
    pageData.recordArea.audio = blobUrl
    assignBlobToAudio(pageData.recordArea.audio)
  }
};

function assignBlobToAudio(blob) {
  const audioElement = document.getElementById('recordedAudio');
  if (audioElement.src !== blob) {
    audioElement.src = blob;
  }
}

function prettyfyHyp(text, doCapFirst, doPrependSpace) {
  text = text.replace(/ ([,.!?:;])/g, '$1')
  text = text.replace(/ ?\n ?/g, '\n')
  text = text.replace(/_/g, ' ')
  return text
}

function getText(pageData) {
  let text = ''
  pageData.res.forEach((s, index) => {
    if (index < pageData.skip) {
      return
    }
    let so = s
    if (!(s.length > 1 && s.charAt(s.length - 1) == '\n')) {
      so = `${s} `
    }
    text += so
  })
  if (pageData.partials !== "") {
    text += pageData.partials
  }
  return text
}

function getOldText(pageData) {
  if (pageData.skip == 1) {
    return pageData.res[0] + "\n"
  }
  return ''
}

function updateRes(pageData) {
  let text = getText(pageData)

  const setResult = (t) => pageData.recordArea.setText(getOldText(pageData) + t)
  if (text.length > 0) {
    punctuate(text, setResult)
  } else {
    setResult(text)
  }
}

function punctuate(text, update) {
  const startTime = performance.now();
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "https://sinteze-test.intelektika.lt/punctuation/punctuation", true)
  xhr.setRequestHeader("Content-Type", "application/json")
  xhr.onload = function () {
    if (xhr.status >= 200 && xhr.status < 300) {
      const res = JSON.parse(xhr.responseText)
      update(res.punctuatedText)
    } else {
      console.error('Request failed with status ' + xhr.status)
      console.error('Body: ' + xhr.responseText)
    }
    const timeElapsed = performance.now() - startTime;
    console.log(`Punctuation time ${timeElapsed} ms`);
  };

  xhr.onerror = function (err) {
    console.error(`Request failed ${err}. Set unpunctuated text`)
    update(text)
  };

  const data = { Text: text }
  const jsonData = JSON.stringify(data)
  xhr.send(jsonData);
}

function updateComponents(pageData) {
  if (pageData.recording) {
    pageData.startButton.style.display = 'none'
    pageData.stopButton.style.display = 'inline-block'

  } else {
    pageData.stopButton.style.display = 'none'
    pageData.startButton.disabled = pageData.workers === 0 || pageData.transcriberWorking
    pageData.startButton.style.display = 'inline-block'
    pageData.startButton.innerHTML = `Įrašyti <span class="workers">${pageData.workers}</span>`
  }
  if (pageData.transcriberWorking) {
    pageData.recordAreaContainer.editable(false)
  } else {
    pageData.recordAreaContainer.editable(true)
  }

  pageData.copyButton.disabled = pageData.recording || pageData.transcriberWorking || !pageData.recordAreaContainer.hasText()
  pageData.clearButton.disabled = pageData.recording || pageData.transcriberWorking || !pageData.recordAreaContainer.hasText()
}

function copyToClipboard(pageData) {
  new Clip().copy(pageData.recordAreaContainer.div, () => {
    pageData.copyButton.innerHTML = "Jau"
    pageData.copyButton.classList.add("copied")
    setTimeout(() => {
      pageData.copyButton.innerHTML = "Kopijuoti";
      pageData.copyButton.classList.remove("copied");
    }, 3000);
  })
}

function resetClearButton(pageData) {
  clearTimeout(pageData.clearTimeout)
  pageData.clearTimeout = null
  pageData.clearButton.classList.remove("warn");
  pageData.clearButton.innerHTML = 'Išvalyti'
}

function clear(pageData) {
  if (pageData.clearTimeout === null) {
    pageData.clearButton.classList.add("warn")
    pageData.clearButton.innerHTML = 'Oi, ne!'
    pageData.clearTimeout = setTimeout(() => {
      pageData.recordAreaContainer.clear()
      assignBlobToAudio(null)
      pageData.recordArea = createOrReturnDiv(pageData, pageData.recordArea)
      resetClearButton(pageData)
      updateComponents(pageData)
    }, 3000);
  } else {
    resetClearButton(pageData)
  }
}