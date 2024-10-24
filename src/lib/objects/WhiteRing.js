import {
    AdditiveBlending,
    Mesh,
    MeshBasicMaterial,
    Object3D,
    RingGeometry,
} from 'three';
import { audio, visualizer } from './../../app';
import { Util } from './../../util/utils';

export const WhiteRing = (() => {

    let scale = 0,
        shapesCount;

    const shapes = [];
    const sides = [3, 4, 5, 6];
    const radius = 1000;
    const groupHolder = new Object3D();
    const config = {
        color: 0xFFFFFF,
        depthTest: false,
        depthWrite: false,
        opacity: 1,
        transparent: true,
        wireframe: false,
        blending: AdditiveBlending,
    };

    const init = () => {

        visualizer.getVizHolder().add(groupHolder);
        const material = new MeshBasicMaterial(config);

        // Create rings of different numbers of sides
        sides.forEach(sideCount => {
            const ringGeometry = new RingGeometry(radius * 0.6, radius, sideCount, 1, 0, Math.PI * 2);
            const ringMesh = new Mesh(ringGeometry, material);
            groupHolder.add(ringMesh);
            shapes.push(ringMesh);
        });

        shapesCount = shapes.length;

        // Init a random shape
        getRandomShape(true);
    };

    const getRandomShape = (force = false) => {
        // Random rotation for the group holder
        groupHolder.rotation.z = Math.random() * Math.PI;

        // Hide all shapes initially
        shapes.forEach(({ rotation }) => rotation.y = Math.PI / 2);

        // Show a shape based on the force flag or random chance
        if (force || Math.random() < 0.5) {
            const random = Util.randomInt(0, shapesCount - 1);
            shapes[random].rotation.y = force ? 0 : Math.random() * Math.PI / 4 - Math.PI / 8;
        }
    };

    const update = () => {
        groupHolder.rotation.z += 0.01;
        const gotoScale = audio.getVolume() * 1.2 + 0.1;
        scale += (gotoScale - scale) / 3;
        groupHolder.scale.x = groupHolder.scale.y = groupHolder.scale.z = scale;
    };

    const onBeat = () => {
        getRandomShape();
    };

    return {
        init,
        update,
        onBeat,
    };
})();
