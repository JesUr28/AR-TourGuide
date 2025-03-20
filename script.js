let synth = window.speechSynthesis;
let isSpeaking = false;
const speakBtn = document.getElementById('speak-btn');
const textToSpeak = document.getElementById('phoenix-text').innerText;

speakBtn.addEventListener('click', () => {
    if (isSpeaking) {
        synth.cancel();
        isSpeaking = false;
        speakBtn.innerText = "Reproducir Texto";
    } else {
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = 'es-ES';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onstart = () => {
            isSpeaking = true;
            speakBtn.innerText = "Detener Reproducción";
        };

        utterance.onend = () => {
            isSpeaking = false;
            speakBtn.innerText = "Reproducir Texto";
        };

        synth.speak(utterance);
    }
});
