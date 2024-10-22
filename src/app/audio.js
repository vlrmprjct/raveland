import { controls } from './controls';
import { fx } from './fx';
import {
    Bars,
    WhiteRing
} from './../lib/objects';

export const audio = (() => {

    let {
        beatDecayRate,
        beatHoldTime,
        bpmMode,
        bpmRate,
        showDebug,
        useMic,
        volSens
    } = controls.audioParams;

    const CTRL = document.getElementById('ctrl')
    const DEBUG_CANVAS = document.createElement('canvas');

    const AVE_BAR_WIDTH = 30;
    const BEAT_MIN = 0.15; // level less than this is no beat

    const CHART_H = 160;
    const CHART_W = 220;
    const DEBUG_SPACE = 2;
    const DEBUG_W = 250;
    const DEBUG_H = 200;
    const LEVELS_COUNT = 24;
    const BPM_HEIGHT = DEBUG_H - CHART_H;

    let analyser;
    let audioContext;
    let beatCutOff = 0;
    let beatTime = 0;
    let binCount;
    let bpmStart;
    let bpmTime = 0; // bpmTime ranges from 0 to 1. 0 = on beat. Based on tap bpm
    let count = 0;
    let debugCtx;
    let freqByteData; //bars - bar data is from 0 - 256 in 512 bins. no sound is 0;
    let gotBeat = false;
    let gradient;
    let isPlayingAudio = false;
    let levelBins;
    let levelHistory = []; // last 256 ave norm levels
    let levelsData = []; // levels of each frequecy - from 0 - 1 . no sound is 0. Array [LEVELS_COUNT]
    let levelSmooth = 0.3;
    let msecsAvg = 633; // time between beats (msec)
    let msecsFirst = 0;
    let msecsPrevious = 0;
    let microphone;
    let ratedBPMTime = 550; // time between beats (msec) multiplied by BPMRate
    let source;
    let timeByteData; // waveform - waveform data is from 0-256 for 512 bins. no sound is 128.
    let timer;
    let volume = 0; // averaged normalized level from 0 - 1
    let waveData = []; // waveform - from 0 - 1 . no sound is 0.5. Array [binCount]

    const init = () => {
        try {
            window.AudioContext = window.AudioContext;
            audioContext = new window.AudioContext();
        } catch (e) {
            alert('Oops! Your browser does not support the Web Audio API.');
            return;
        }

        analyser = createAnalyser();
        analyser.connect(audioContext.destination);
        binCount = analyser.frequencyBinCount; // RETURNS 512
        levelBins = Math.floor(binCount / LEVELS_COUNT);

        freqByteData = new Uint8Array(binCount);
        timeByteData = new Uint8Array(binCount);

        levelHistory = Array.from({ length: 256 }, () => 0);

        // INIT DEBUG DRAW
        CTRL.prepend(DEBUG_CANVAS);

        const debugConfig = {
            fillStyle: '#FFFFFF',
            height: DEBUG_H,
            lineWidth: 2,
            strokeStyle: '#FFFFFF',
            width: DEBUG_W,
        };

        debugCtx = DEBUG_CANVAS.getContext('2d');
        Object.assign(debugCtx, debugConfig);

        const gradientConfig = [
            { offset: 1.00, color: '#00FF00' },
            { offset: 0.65, color: '#00FF00' },
            { offset: 0.25, color: '#FFA500' },
            { offset: 0.15, color: '#8B0000' },
        ];

        gradient = debugCtx.createLinearGradient(0, 0, 0, 256);
        gradientConfig.forEach(({ offset, color }) => gradient.addColorStop(offset, color));

        msecsAvg = 500; // Assume 120BPM
        timer = setInterval(onBMPBeat, msecsAvg);
    }


    const createAnalyser = () => {
        const analyser = audioContext.createAnalyser();
        analyser.smoothingTimeConstant = levelSmooth;
        analyser.fftSize = 1024;
        return analyser;
    }

    const stopSound = () => {
        if (!isPlayingAudio) return;
        isPlayingAudio = false;
        if (source) {
            source.stop(0);
            source.disconnect();
        }
        debugCtx.clearRect(0, 0, DEBUG_W, DEBUG_H);
    }

    /**
     * onUseMic - called when the user clicks the "Use Mic" checkbox
     *
     * If the checkbox is checked, it will attempt to get audio from the user's
     * microphone. If the checkbox is unchecked, it will stop any currently
     * playing audio.
     */
    const onUseMic = () => {
        useMic ? getMicInput() : stopSound();
    }

    /**
     * Gets audio input from the user's microphone
     *
     * This function is called whenever the user clicks the "Use Mic"
     * checkbox. It will attempt to get audio from the user's microphone
     * and start playing it.
     */
    const getMicInput = () => {
        stopSound();

        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {

                // Create a new MediaStreamSource from the user's microphone
                microphone = audioContext.createMediaStreamSource(stream);

                // Create a new BufferSource to play the audio
                source = audioContext.createBufferSource();

                // Create an Analyser to analyze the audio
                analyser = analyser = createAnalyser();

                // Connect the sources to the analyser
                microphone.connect(analyser);

                // Start playing the audio
                isPlayingAudio = true;
            })
            .catch(err => {
                console.error('Could not get user media:', err);
            });
    }

    /**
     * Handles the beat event, triggering effects and visual updates.
     */
    const onBeat = () => {
        // Set the beat flag to true
        gotBeat = true;

        // Return early if BPM mode is enabled
        if (bpmMode) return;

        // Trigger visual and effect updates on beat
        fx.onBeat();
        Bars.onBeat();
        WhiteRing.onBeat();
    }

    /**
     * Handles the beat event from the timer when BPM mode is enabled.
     *
     * When BPM mode is enabled, a timer is started and this function is called
     * every time the timer fires. It checks if a beat has been triggered since
     * the last time the timer fired, and if so, it calls the onBeat function
     * to trigger visual and effect updates.
     */
    const onBMPBeat = () => {
        bpmStart = Date.now();

        if (!bpmMode) return;

        if (gotBeat) {
            gotBeat = false;
            onBeat();
        }
    }

    const update = () => {
        if (!isPlayingAudio) return;

        analyser.getByteFrequencyData(freqByteData);
        analyser.getByteTimeDomainData(timeByteData);

        waveData = timeByteData.map((val, i) => ((val - 128) / 128) * volSens);

        levelsData = freqByteData.reduce((acc, val, index) => {
            const binIndex = Math.floor(index / levelBins);
            acc[binIndex] = (acc[binIndex] || 0) + val;
            return acc;
        }, []).map(sum => (sum / levelBins / 256) * volSens);

        volume = levelsData.slice(0, LEVELS_COUNT).reduce((acc, val) => acc + val, 0) / LEVELS_COUNT;

        levelHistory.push(volume);
        levelHistory.shift(1);

        if (volume > beatCutOff && volume > BEAT_MIN) {
            onBeat();
            beatCutOff = volume * 1.1;
            beatTime = 0;
        } else {
            if (beatTime <= beatHoldTime) {
                beatTime++;
            } else {
                beatCutOff *= beatDecayRate;
                beatCutOff = Math.max(beatCutOff, BEAT_MIN);
            }
        }

        bpmTime = (Date.now() - bpmStart) / msecsAvg;

        debugDraw();
    }

    const debugDraw = () => {

        if (!showDebug) return;

        debugCtx.clearRect(0, 0, DEBUG_W, DEBUG_H);
        //draw chart bkgnd
        debugCtx.fillStyle = '#000';
        debugCtx.fillRect(0, 0, DEBUG_W, DEBUG_H);

        //DRAW BAR CHART
        // Break the samples up into bars
        var barWidth = CHART_W / LEVELS_COUNT;
        debugCtx.fillStyle = gradient;
        for (var i = 0; i < LEVELS_COUNT; i++) {
            debugCtx.fillRect(i * barWidth, CHART_H, barWidth - DEBUG_SPACE, - levelsData[i] * CHART_H);
        }

        //DRAW AVE LEVEL + BEAT COLOR
        if (beatTime < 6) {
            debugCtx.fillStyle = '#F33';
        }
        debugCtx.fillRect(CHART_W, CHART_H, AVE_BAR_WIDTH, -volume * CHART_H);

        //DRAW CUT OFF
        debugCtx.beginPath();
        debugCtx.moveTo(CHART_W, CHART_H - beatCutOff * CHART_H);
        debugCtx.lineTo(CHART_W + AVE_BAR_WIDTH, CHART_H - beatCutOff * CHART_H);
        debugCtx.stroke();

        //DRAW WAVEFORM
        debugCtx.beginPath();
        for (var i = 0; i < binCount; i++) {
            debugCtx.lineTo((i / binCount) * CHART_W, (waveData[i] * CHART_H) / 2 + CHART_H / 2);
        }
        debugCtx.stroke();

        // DRAW BPM
        // !FIXME: SHOWS NOTHING RIGHT NOW, NEEDS TO BE FIXED !
        var bpmMaxSize = BPM_HEIGHT;
        var size = bpmMaxSize - bpmTime * bpmMaxSize;
        debugCtx.fillStyle = '#F00';
        debugCtx.fillRect(0, CHART_H, bpmMaxSize, bpmMaxSize);
        debugCtx.fillStyle = '#0F0';
        debugCtx.fillRect((bpmMaxSize - size) / 2, CHART_H + (bpmMaxSize - size) / 2, size, size);
    }

    const onTap = () => {
        console.log('ontap');

        clearInterval(timer);

        timeSeconds = new Date();
        msecs = timeSeconds.getTime();

        //after 2 seconds, new tap counts as a new sequnce
        if (msecs - msecsPrevious > 2000) {
            count = 0;
        }

        if (count === 0) {
            console.log('First Beat');
            msecsFirst = msecs;
            count = 1;
        } else {
            bpmAvg = (60000 * count) / (msecs - msecsFirst);
            msecsAvg = (msecs - msecsFirst) / count;
            count++;
            console.log('bpm: ' + Math.round(bpmAvg * 100) / 100 + ' , taps: ' + count + ' , msecs: ' + msecsAvg);
            onBMPBeat();
            clearInterval(timer);
            timer = setInterval(onBMPBeat, msecsAvg);
        }
        msecsPrevious = msecs;
    }

    const onChangeBPMRate = () => {
        //change rate without losing current beat time

        //get ratedBPMTime from real bpm
        switch (bpmRate) {
            case -3:
                ratedBPMTime = msecsAvg * 8;
                break;
            case -2:
                ratedBPMTime = msecsAvg * 4;
                break;
            case -1:
                ratedBPMTime = msecsAvg * 2;
                break;
            case 0:
                ratedBPMTime = msecsAvg;
                break;
            case 1:
                ratedBPMTime = msecsAvg / 2;
                break;
            case 2:
                ratedBPMTime = msecsAvg / 4;
                break;
            case 3:
                ratedBPMTime = msecsAvg / 8;
                break;
            case 4:
                ratedBPMTime = msecsAvg / 16;
                break;
        }

        //get distance to next beat
        bpmTime = (new Date().getTime() - bpmStart) / msecsAvg;

        timeToNextBeat = ratedBPMTime - (new Date().getTime() - bpmStart);

        //set one-off timer for that
        clearInterval(timer);
        timer = setInterval(onFirstBPM, timeToNextBeat);

        //set timer for new beat rate
    }

    const onFirstBPM = () => {
        clearInterval(timer);
        timer = setInterval(onBMPBeat, ratedBPMTime);
    }

    return {
        onUseMic,
        update,
        init,
        onTap,
        onChangeBPMRate,
        getLevelsData: () => {
            return levelsData;
        },
        getVolume: () => {
            return volume;
        },
        getBPMTime: () => {
            return bpmTime;
        },
    };
})();
