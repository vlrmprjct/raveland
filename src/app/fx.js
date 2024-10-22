import {
    WebGLRenderTarget,
    LinearFilter,
    RGBFormat,
} from 'three';
import {
    BloomPass,
    EffectComposer,
    RenderPass,
    ShaderPass
} from './../lib/postprocess';
import {
    BadTVShader,
    CopyShader,
    AdditiveBlendShader,
    MirrorShader,
    FilmShader,
    RGBShiftShader,
    VerticalBlurShader,
    HorizontalBlurShader,
} from './../lib/shaders';
import {
    controls,
    visualizer
} from './';
import { Util } from './../util/utils';

export const fx = (() => {
    let renderer, scene, camera;

    let blendComposer,
        badTVPass,
        blendPass,
        bloomPass,
        composer,
        copyPass,
        filmPass,
        glowComposer,
        mirrorPass,
        renderPass,
        renderTarget,
        renderTarget2,
        rgbPass;

    let hblurPass, vblurPass;
    let shaderTime = 0;

    const BLUR = 3.0;
    const SCREEN_W = window.innerWidth;
    const SCREEN_H = window.innerHeight;

    const init = () => {

        camera = visualizer.getCamera();
        renderer = visualizer.getRenderer();
        scene = visualizer.getScene();

        const renderTargetParameters = {
            format: RGBFormat,
            magFilter: LinearFilter,
            minFilter: LinearFilter,
            stencilBufer: false,
        };

        if (!scene || !camera || !renderer) {
            console.error('Scene, Camera or Renderer is null or not initialized.');
            return;
        }

        renderTarget = new WebGLRenderTarget(SCREEN_W, SCREEN_H, renderTargetParameters);
        composer = new EffectComposer(visualizer.getRenderer(), renderTarget);
        renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);

        copyPass = new ShaderPass(CopyShader);
        composer.addPass(copyPass);

        bloomPass = new BloomPass(3, 12, 2.0, 512);
        composer.addPass(bloomPass);

        hblurPass = new ShaderPass(HorizontalBlurShader);
        vblurPass = new ShaderPass(VerticalBlurShader);
        hblurPass.uniforms['h'].value = BLUR / SCREEN_W;
        vblurPass.uniforms['v'].value = BLUR / SCREEN_H;
        composer.addPass(hblurPass);
        composer.addPass(vblurPass);

        renderTarget2 = new WebGLRenderTarget(SCREEN_W / 4, SCREEN_H / 4, renderTargetParameters);
        glowComposer = new EffectComposer(renderer, renderTarget2);
        glowComposer.addPass(copyPass);
        glowComposer.addPass(renderPass);

        blendComposer = new EffectComposer(renderer);
        blendPass = new ShaderPass(AdditiveBlendShader);
        blendPass.uniforms['tBase'].value = composer.renderTarget1.texture;
        blendPass.uniforms['tAdd'].value = glowComposer.renderTarget1.texture;
        blendPass.uniforms['amount'].value = 0;
        blendComposer.addPass(blendPass);

        filmPass = new ShaderPass(FilmShader);
        filmPass.uniforms["grayscale"].value = 0;
        filmPass.uniforms["sIntensity"].value = 0.8;
        filmPass.uniforms["sCount"].value = 600;

        badTVPass = new ShaderPass(BadTVShader);
        badTVPass.uniforms['distortion'].value = 3.0;
        badTVPass.uniforms['distortion2'].value = 1.0;
        badTVPass.uniforms['speed'].value = 0.1;
        badTVPass.uniforms['rollSpeed'].value = 0.05;
        composer.addPass(badTVPass);

        mirrorPass = new ShaderPass(MirrorShader);
        mirrorPass.uniforms['side'].value = 2;

        rgbPass = new ShaderPass(RGBShiftShader);

        blendComposer.addPass(mirrorPass);
        blendComposer.addPass(rgbPass);
        blendComposer.addPass(filmPass);
    };

    const onBeat = () => {
        badTVPass.uniforms["distortion"].value = 4.0;
        badTVPass.uniforms["distortion2"].value = 5.0;
        mirrorPass.uniforms["side"].value = Math.floor(Util.randomInt(0, 3));

        setTimeout(onBeatEnd, 300);
    };

    const onBeatEnd = () => {
        badTVPass.uniforms["distortion"].value = 0.0001;
        badTVPass.uniforms["distortion2"].value = 0.0001;
    };

    const update = () => {
        shaderTime += 0.1;
        filmPass.uniforms['time'].value = shaderTime;
        badTVPass.uniforms['time'].value = shaderTime;
        blendPass.uniforms['amount'].value = controls.fxParams.glow;

        composer.render(0.1);
        glowComposer.render(0.1);
        blendComposer.render(0.1);
    }

    return {
        init,
        update,
        onBeat,
    };
})();
