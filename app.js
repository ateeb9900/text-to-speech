let voices = [];
let mediaRecorder;
let audioChunks = [];
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function populateVoices() {
    voices = window.speechSynthesis.getVoices();
    const voiceSelect = document.getElementById("voice-selection");
    voiceSelect.innerHTML = '';

    // Filter and display both Hindi and English voices
    voices.forEach((voice, index) => {
        if (voice.lang.startsWith('hi') || voice.lang.startsWith('en')) {
            const option = document.createElement("option");
            option.value = index;
            option.textContent = `${voice.name} (${voice.lang})`;
            voiceSelect.appendChild(option);
        }
    });

    if (voiceSelect.options.length > 0) {
        voiceSelect.selectedIndex = 0;
    }
}

function startSpeaking() {
    const text = document.getElementById("text-input").value;
    const voiceSelect = document.getElementById("voice-selection");
    const selectedVoiceIndex = voiceSelect.value;

    if (selectedVoiceIndex === '') {
        alert('No voices available.');
        return;
    }

    const selectedVoice = voices[selectedVoiceIndex];
    const speech = new SpeechSynthesisUtterance(text);
    speech.voice = selectedVoice;

    // Create a MediaStream for recording
    const mediaStream = audioContext.createMediaStreamDestination();
    
    // Create a new MediaRecorder to capture audio
    mediaRecorder = new MediaRecorder(mediaStream.stream);
    mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const arrayBuffer = await audioBlob.arrayBuffer();
        const wav = new Uint8Array(arrayBuffer);
        const mp3Data = encodeMP3(wav);
        const audioUrl = URL.createObjectURL(new Blob([mp3Data], { type: 'audio/mp3' }));
        const downloadButton = document.getElementById("download");
        downloadButton.style.display = 'inline';
        downloadButton.href = audioUrl;
        audioChunks = []; // Clear chunks for next recording
    };

    mediaRecorder.start();

    // Speak the text and stop recording when finished
    speech.onend = () => {
        mediaRecorder.stop();
    };

    // Start speech synthesis
    window.speechSynthesis.speak(speech);
}

// Function to encode WAV to MP3 using lamejs
function encodeMP3(wavData) {
    const mp3Encoder = new lamejs.Mp3Encoder(1, 44100, 128);
    const mp3Data = [];

    const samples = new Int16Array(wavData.buffer);
    let remaining = samples.length;

    let offset = 0;
    while (remaining >= 1152) {
        const mp3buf = mp3Encoder.encodeBuffer(samples.subarray(offset, offset + 1152));
        if (mp3buf.length > 0) {
            mp3Data.push(new Int8Array(mp3buf));
        }
        offset += 1152;
        remaining -= 1152;
    }

    const mp3buf = mp3Encoder.flush(); // Finish writing the mp3
    if (mp3buf.length > 0) {
        mp3Data.push(new Int8Array(mp3buf));
    }

    return new Uint8Array(mp3Data.reduce((acc, curr) => acc.concat(Array.from(curr)), []));
}

// Load voices when available
window.speechSynthesis.onvoiceschanged = populateVoices;
document.getElementById("speak-button").onclick = startSpeaking;







