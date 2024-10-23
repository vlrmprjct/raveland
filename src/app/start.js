import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { Mesh, MeshBasicMaterial, Scene, PerspectiveCamera, WebGLRenderer } from 'three';
import { RenderPass, EffectComposer, ShaderPass } from './../lib/postprocess';
import { BadTVShader, DigitalGlitch, FilmShader, RGBShiftShader } from './../lib/shaders';

export const start = (container = null) => {
    if (!container) return false;

    let glitchTime = 0;
    let glitchDelay = 200;
    let bypassTime = 0;
    let isBypassing = false;
    let renderer;

    const loader = new FontLoader();
    loader.load('font/helvetiker_regular.typeface.json', (font) => {
        const geometry = new TextGeometry('Press [P] to PLAY', {
            font,
            size: 60,
            depth: 5
        });

        geometry.center();

        const material = new MeshBasicMaterial({ color: 0xffffff });
        const textMesh = new Mesh(geometry, material);

        const scene = new Scene();
        scene.add(textMesh);

        const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 600;

        const filmPass = new ShaderPass(FilmShader);
        filmPass.uniforms["grayscale"].value = 0;
        filmPass.uniforms["sIntensity"].value = 0.8;
        filmPass.uniforms["sCount"].value = 600;

        const badTVPass = new ShaderPass(BadTVShader);
        badTVPass.uniforms['distortion'].value = 1.0;
        badTVPass.uniforms['distortion2'].value = 1.0;

        const glitchPass = new ShaderPass(DigitalGlitch);
        glitchPass.uniforms['amount'].value = 0.0005;

        const rgbPass = new ShaderPass(RGBShiftShader);
        const composer = new EffectComposer(new WebGLRenderer());

        composer.addPass(new RenderPass(scene, camera));
        composer.addPass(rgbPass);
        composer.addPass(filmPass);
        composer.addPass(badTVPass);
        composer.addPass(glitchPass);

        renderer = composer.renderer;

        const onWindowResize = () => {
            const width = window.innerWidth;
            const height = (width / 16) * 9;

            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };

        onWindowResize();
        container.appendChild(renderer.domElement);
        window.addEventListener('resize', onWindowResize);

        const render = (time) => {
            requestAnimationFrame(render);

            if (time - glitchTime > glitchDelay) {
                glitchTime = time;
                glitchPass.uniforms['byp'].value = Math.random() < 0.5 ? 1 : 0;
                glitchPass.uniforms['distortion_y'].value = 0.006;
                glitchPass.uniforms['col_s'].value = 0.015;

                if (Math.random() < 0.2) {
                    isBypassing = true;
                    bypassTime = time;
                    glitchPass.uniforms['byp'].value = 1;
                }
            }

            if (isBypassing && time - bypassTime > 100) {
                glitchPass.uniforms['byp'].value = 0;
                isBypassing = false;
            }

            composer.render();
        };
        render();
    });
};
