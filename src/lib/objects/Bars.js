import {
    BufferAttribute,
    DoubleSide,
    Mesh,
    MeshBasicMaterial,
    Object3D,
    PlaneGeometry,
} from 'three';
import {
    audio,
    controls,
    visualizer
} from './../../app';
import { Util } from './../../util/utils';

export const Bars = (() => {

	let groupHolder;
	let vertDistance;
    let fillFactor = 0.8;
	let planeWidth = 2000;
	let segments = 10;

    let BAR_COUNT = controls.fxParams.bars;

	const init = (updated = false) => {

        if (updated) visualizer.getVizHolder().remove(groupHolder);

		groupHolder = new Object3D();
		visualizer.getVizHolder().add(groupHolder);
		groupHolder.position.z = 300;
		vertDistance = 1580 / BAR_COUNT;
		groupHolder.rotation.z = Math.PI / 4;

        Array.from({ length: BAR_COUNT }).forEach((_, j) => {
            const planeMat = new MeshBasicMaterial({
                color: 0xebff33,
                side: DoubleSide,
            });
            planeMat.color.setHSL(j / BAR_COUNT, 1.0, 0.5);

            const mesh = new Mesh(
                new PlaneGeometry(planeWidth, vertDistance, segments, segments),
                planeMat
            );

            mesh.position.y = vertDistance * j - vertDistance * BAR_COUNT / 2;
            mesh.scale.y = (j + 1) / BAR_COUNT * fillFactor;

            groupHolder.add(mesh);
        });

	}

    const noise = (x, y) => {
        const F2 = 0.5 * (Math.sqrt(3) - 1);
        const s = (x + y) * F2;
        const i = Math.floor(x + s);
        const j = Math.floor(y + s);
        const G2 = (3 - Math.sqrt(3)) / 6;
        const t = (i + j) * G2;
        const x0 = x - i + t;
        const y0 = y - j + t;

        const n0 = Math.sin(x0 * 12.9898 + y0 * 78.233) * 0.5;
        const n1 = Math.sin((x0 - 1 + 2 * G2) * 12.9898 + y0 * 78.233) * 0.5;
        const n2 = Math.sin(x0 * 12.9898 + (y0 - 1 + 2 * G2) * 78.233) * 0.5;

        return (n0 + n1 + n2) * 0.3333;
    };

    const displaceMesh = () => {
        const MAX_DISP = Math.random() * 600;
        const rnd = Math.random();

        for (let j = 0; j < BAR_COUNT; j++) {
            var mesh = groupHolder.children[j];

            const positionAttribute = mesh.geometry.attributes.position;

            if (!(positionAttribute instanceof BufferAttribute)) {
                continue;
            }

            for (let i = 0; i < positionAttribute.count; i++) {
                const x = positionAttribute.getX(i);
                const disp = noise(x / planeWidth * 100, rnd) * MAX_DISP;
                positionAttribute.setZ(i, disp);
            }

            positionAttribute.needsUpdate = true;
        }
    }

    const update = () => {
        const newBarCount = controls.fxParams.bars;
        if (newBarCount !== BAR_COUNT) {
            BAR_COUNT = newBarCount;
            init(true);
        }
        groupHolder.position.y = audio.getBPMTime() * vertDistance;
        for (let j = 0; j < BAR_COUNT; j++) {
            groupHolder.children[j].scale.y = audio.getLevelsData()[j] * audio.getLevelsData()[j] + 0.00001;
        }
    }

	const onBeat = () => {
		groupHolder.rotation.z = Math.PI / 4 * Util.randomInt(0, 4);
		groupHolder.rotation.y = Util.randomRange(-Math.PI / 4, Math.PI / 4);

		displaceMesh();
	}

	return {
		init,
        update,
        onBeat,
	};
})();
