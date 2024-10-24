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

let lastUpdateTime = 0;
let started = false;

const FPS = 30;
const updateInterval = 1000 / FPS;
const ctrl = document.getElementById('ctrl');
const intro = document.getElementById('intro');

export const main = (() => {

    const { vizParams } = controls;

    const init = () => {
        window.addEventListener('keydown', onKeyDown, false);
        window.addEventListener('resize', onResize, false);
        intro.addEventListener('click', onIntroClick, false);

        start(intro);
    };

    const startMusic = () => {
        audio.init();
        controls.init();
        visualizer.init();
        fx.init();
        onResize();
        update();
        intro.remove();
        started = true;
    };

    const update = (currentTime) => {
        requestAnimationFrame(update);
        const timeDiff = currentTime - lastUpdateTime;

        if (timeDiff >= updateInterval) {
            lastUpdateTime = currentTime;
            audio.update();
            fx.update();
            visualizer.update();
            Bars.update();
            WhiteRing.update();
        }
    };

    const onKeyDown = ({ keyCode }) => {
        const keys = {
            32: () => started && audio.onTap(),
            81: () => started && toggleControls(),
            80: () => !started && startMusic(),
        };
        const handler = keys[keyCode];
        handler && handler();
    };

    const onIntroClick = () => {
        if (!started) startMusic();
    };

    const onResize = () => {
        visualizer.onResize();
    };

    const toggleControls = () => {
        vizParams.showControls = !vizParams.showControls;
        ctrl.style.display = (vizParams.showControls) ? 'block' : 'none';
    };

    return {
        init,
    };

})();
