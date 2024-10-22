import {
    AdditiveBlending,
    Mesh,
    MeshBasicMaterial,
    Object3D,
    RingGeometry,
} from 'three';
import { audio, visualizer } from './../../app';

export const WhiteRing = (() => {

    let scale = 0,
        shapesCount;

    const shapes = [];
    const RADIUS = 1000;
    const groupHolder = new Object3D();

    const init = () => {

        visualizer.getVizHolder().add(groupHolder);

        const material = new MeshBasicMaterial({
            color: 0xFFFFFF,
            depthTest: false,
            depthWrite: false,
            opacity: 1,
            transparent: true,
            wireframe: false,
            blending: AdditiveBlending,
        });

        // Create rings of different numbers of sides
        const sides = [3, 4, 5, 6];
        sides.forEach(sideCount => {
            const ringGeometry = new RingGeometry(RADIUS * 0.6, RADIUS, sideCount, 1, 0, Math.PI * 2);
            const ringMesh = new Mesh(ringGeometry, material);
            groupHolder.add(ringMesh);
            shapes.push(ringMesh);
        });

        shapesCount = shapes.length;
    }

    const showNewShape = () => {

        // Random rotation
        groupHolder.rotation.z = Math.random() * Math.PI;

        // Hide shapes
        shapes.forEach(({ rotation }) => rotation.y = Math.PI / 2);

        // Show a shape sometimes
        if (Math.random() < .5) {
            const r = Math.floor(Math.random() * shapesCount);
            shapes[r].rotation.y = Math.random() * Math.PI / 4 - Math.PI / 8;
        }
    }

    const update = () => {
        groupHolder.rotation.z += 0.01;
        const gotoScale = audio.getVolume() * 1.2 + 0.1;
        scale += (gotoScale - scale) / 3;
        groupHolder.scale.x = groupHolder.scale.y = groupHolder.scale.z = scale;
    }

    const onBeat = () => {
        showNewShape();
    }

    return {
        init,
        update,
        onBeat,
    };
})();
