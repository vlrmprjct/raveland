import {
    audio,
    controls,
    fx,
    start,
    visualizer
} from './';
import {
    Bars,
    WhiteRing
} from './../lib/objects';

const ctrl = document.getElementById('ctrl');
const intro = document.getElementById('intro');

let started = false;

export const main = (() => {

    const init = () => {
		window.addEventListener('keydown', onKeyDown, false);
        window.addEventListener('resize', onResize, false);

        start(intro);
	}

    const startMusic = () => {
        audio.init();
	    controls.init();
		visualizer.init();
		fx.init();
		onResize();
		update();
		intro.style.display = 'none';
		started = true;
	}

	const update = () => {
		requestAnimationFrame(update);
        audio.update();
        fx.update();
        visualizer.update();
        Bars.update();
        WhiteRing.update();
	}

	const onKeyDown = (event) => {
		switch (event.keyCode) {
			case 32 /* space */:
				audio.onTap();
				break;
			case 81 /* q */:
				if (started) toggleControls();
				break;
			case 80 /* p */:
				if (!started) startMusic();
				break;
		}
	}

	const onResize = () => {
		visualizer.onResize();
	}

	const toggleControls = () => {
		controls.vizParams.showControls = !controls.vizParams.showControls;
		ctrl.style.display = (controls.vizParams.showControls) ? 'block' : 'none';
	}

    return {
		init: init,
	};

})();
