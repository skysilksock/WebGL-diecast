import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

import { initCamera } from "./camera.js";

// 公共变量
let scene = null;
let camera = null
let renderer = null;
const gui = new GUI();
const mixers = [];
const models = {};
window.models = models;

const textureObject = [
    "猴头", "立方体", "立方体001", "dragon"
]

const spriteLoader = new THREE.TextureLoader();

camera = initCamera();
scene = new THREE.Scene();
scene.add(camera);
renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

export class LoadModel {
    constructor(scene) {
        this.scene = scene;
        this.fbxLoader = new FBXLoader();
        this.gltfLoader = new GLTFLoader();
    }

    // 对于每个解析出来的对象需要添加到场景中，并创建模型类加入管理
    // pass
    loadModel(path) {
        const filename = path.split('/').pop();
        const [modelname, tmp] = filename.split('.');
        switch (tmp) {
            case 'fbx':
                this.fbxLoader.load(path, (obj) => {
                    models[modelname] = new ModelControler(obj);
                    console.log(obj.name, obj);
                    this.scene.add(obj);
                    // 遍历模型的子对象
                    obj.traverse((child) => {
                        if (child.isMesh) {
                            console.log(child.name);
                            // 随机生成颜色
                            const randomColor = new THREE.Color(Math.random() * 0xffffff);

                            // 设置网格对象的材质颜色
                            if (child.material instanceof Array) {
                                // 如果模型有多个材质，则设置每个材质的颜色
                                child.material.forEach((material) => {
                                    material.color.copy(randomColor);
                                });
                            } else {
                                // 如果模型只有一个材质，则直接设置该材质的颜色
                                child.material.color.copy(randomColor);
                            }
                        }
                        // if (modelname == "dcc800_0524_1") {
                        //     // 创建控制器并添加到 GUI 中
                        //     const folder = gui.addFolder(child.name);
                        //     folder.add(child, 'visible').name('Visible');
                        // }
                    });
                })
                break;
            case 'glb':
                this.gltfLoader.load(path, (obj) => {
                    console.log(obj.scene);
                    models[modelname] = new ModelControler(obj.scene);
                    this.scene.add(obj.scene);
                })
                break;
            case 'gltf':
                this.gltfLoader.load(path, (obj) => {
                    console.log(obj.scene);
                    models[modelname] = new ModelControler(obj.scene);
                    this.scene.add(obj.scene);
                })
                break;
        }
    }
}

export class ModelControler {
    constructor(obj, speed = 0.1) {
        this.obj = obj;
        speed = speed;
        this.mixer = new THREE.AnimationMixer(obj);
        this.space = 1;
    }

    async moveStraight(length, vec3 = null, time = 200) {
        if (!length) throw new Error("Length not provided");
        let dx, dy, dz;
        if (!vec3) {
            const direction = new THREE.Vector3();
            this.obj.getWorldDirection(direction);
            dx = direction.x;
            dy = direction.y;
            dz = direction.z;
        }
        else {
            [dx, dy, dz] = vec3;
        }

        const sign = Math.sign(length);
        length = Math.abs(length);
        const speed = length / time;

        while (length > 0) {
            await new Promise(resolve => setTimeout(resolve, 1)); // 等待1毫秒
            this.obj.position.x += speed * dx * sign;
            this.obj.position.y += speed * dy * sign;
            this.obj.position.z += speed * dz * sign;
            length -= speed;
        }
    }


    async rotate(angle, speed = 0.01) {
        if (!angle) throw new Error("Angle not provided");

        const sign = Math.sign(angle);
        angle = Math.abs(angle);

        while (angle > 0) {
            await new Promise(resolve => setTimeout(resolve, 1)); // 等待1毫秒
            this.obj.rotation.y += speed * sign;
            angle -= speed;
        }
    }


    async animationPlay(name, reverse = false, wait = true) {
        if (mixers.indexOf(this.mixer) == -1) mixers.push(this.mixer);
        console.log(mixers);
        const clip = THREE.AnimationClip.findByName(this.obj.animations, name);
        console.log(clip);
        console.log(JSON.stringify(clip));
        for (let track of clip.tracks) {
            console.log(track.times[track.times.length - 1]);
        }
        if (!clip) throw new Error("Animation clip not found");
        const action = this.mixer.clipAction(clip); // 返回动画操作器对象
        action.clampWhenFinished = true; // 动画结束后保持最后一帧
        action.loop = THREE.LoopOnce; // 只播放一次
        // 设置动画播放时间
        this.mixer.time = 0;
        clip.resetDuration();
        action.play();
        console.log(clip);
        if (wait) await new Promise(resolve => setTimeout(resolve, (clip.duration + 1.5) * 1000));
        if (reverse) {
            // 反转动画方向
            action.timeScale = -1;
        }
    }
}

export { scene, camera, gui, models, mixers, renderer, spriteLoader };