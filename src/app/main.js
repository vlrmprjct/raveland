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

let lastTime = 0;
const FPS = 30;
const updateInterval = 1000 / FPS;
let started = false;

export const main = (() => {

    const init = () => {
		window.addEventListener('keydown', onKeyDown, false);
        window.addEventListener('resize', onResize, false);
        intro.addEventListener('click', onIntroClick, false);

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

    const update = (time) => {
        requestAnimationFrame(update);
        const delta = time - lastTime;

        if (delta >= updateInterval) {
            lastTime = time;
            audio.update();
            fx.update();
            visualizer.update();
            Bars.update();
            WhiteRing.update();
        }
    }

	const onKeyDown = ({ keyCode }) => {
		const keys = {
			32: () => audio.onTap(),
			81: () => started && toggleControls(),
			80: () => !started && startMusic(),
		};
		const handler = keys[keyCode];
		handler && handler();
	};

    const onIntroClick = () => {
        if (!started) startMusic();
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
