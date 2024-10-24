import dat from 'dat.gui';
import {
    audio,
    visualizer
} from './';

export const controls = (() => {

	const audioParams = {
		beatDecayRate: 0.97,
		beatHoldTime: 40,
		bpmMode: false,
		bpmRate: 0,
		showDebug: true,
		useMic: true,
		useSample: false,
		volSens: 1.5,
	};

	const vizParams = {
		fullSize: true,
		showControls: false,
	};

	const fxParams = {
		glow: 1.0,
        bars: 16,
	};

	const init =() => {

		const gui = new dat.GUI({ autoPlace: false });
		document.getElementById('settings').appendChild(gui.domElement);

		const f2 = gui.addFolder('Audio');
		f2.add(audioParams, 'useMic').listen().onChange(audio.onUseMic).name('Use Mic');
		f2.add(audioParams, 'volSens', 0, 10).step(0.1).name('Gain');
		f2.add(audioParams, 'beatHoldTime', 0, 100).step(1).name('Beat Hold');
		f2.add(audioParams, 'beatDecayRate', 0.9, 1).step(0.01).name('Beat Decay');
		f2.add(audioParams, 'bpmMode').listen().name('BPM Mode');
		f2.add(audioParams, 'bpmRate', 0, 4).step(1).listen().name('BPM Rate').onChange(audio.onChangeBPMRate);
		f2.open();

		const f3 = gui.addFolder('FX');
		f3.add(fxParams, 'glow', 0, 4).step(0.1).name('Glow');
        f3.add(fxParams, 'bars', 1, 32).step(1).name('Bars');
		f3.open();

		const f4 = gui.addFolder('Viz');
		f4.add(vizParams, 'fullSize').listen().onChange(visualizer.onResize).name('Full Size');
		f4.open();
	}

	return {
		init,
		audioParams,
		fxParams,
		vizParams,
	};
})();
