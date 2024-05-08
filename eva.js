import './style.css';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { abs } from 'three/examples/jsm/nodes/Nodes.js';
import { initCamera } from "./js/camera.js";
import { AntiVisible, changeGeomtry, ChangeTexture } from './js/visible.js';



// 公共变量
let scene = null;
let camera = null
let renderer = null;
const gui = new GUI();
const mixers = [];
// const fbxLoader = new FBXLoader();
// const gltfLoader = new GLTFLoader();
// const modelPath = ['./models/LK/dcc800_0524_1.fbx', './models/LK/factory1.obj', './models/LK/Warahouse.fbx', './models/LK/上部防护罩.fbx', './models/LK/侧面围挡+门.fbx', './models/LK/保温炉.fbx', './models/LK/压射杆后端2 1.fbx', './models/LK/压射杆后端2.fbx', './models/LK/压铸机_喷雾机器人.fbx', './models/LK/尾板+哥林柱2.fbx', './models/LK/活塞杆后端.fbx', './models/LK/给汤机_坐标调整.fbx'];
const modelPath =
    [
        "./models/行车.fbx",
        "./models/模具.fbx",
        './models/LK/dcc800_0524_1.fbx',
        // './models/LK/factory1.obj',
        './models/LK/Warahouse.fbx',
        "./models/LK/保温炉.fbx",
        // "./models/LK/给汤机_坐标调整.fbx",
        "./models/car.fbx",
        // "./models/给汤机_animation.fbx",d
        // "./models/test.fbx"
    ]
const models = {};

// ! 类

class LoadModel {
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
        console.log(tmp);
        switch (tmp) {
            case 'fbx':
                this.fbxLoader.load(path, (obj) => {
                    console.log(obj);
                    models[modelname] = new ModelControler(obj);
                    this.scene.add(obj);
                    window.obj = obj;
                    // 遍历模型的子对象
                    obj.traverse((child) => {
                        if (child.isMesh) {
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
        }
    }
}

class ModelControler {
    constructor(obj, speed = 0.1) {
        this.obj = obj;
        this.speed = speed;
        this.mixer = new THREE.AnimationMixer(obj);
        this.space = 1;
    }

    async moveStraight(length, vec3 = null) {
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

        while (length > 0) {
            await new Promise(resolve => setTimeout(resolve, 1)); // 等待1毫秒
            console.log(dx, dy, dz);
            this.obj.position.x += this.speed * dx * sign;
            this.obj.position.y += this.speed * dy * sign;
            this.obj.position.z += this.speed * dz * sign;
            length -= this.speed;
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


    animationPlay(name) {
        if (mixers.indexOf(this.mixer) == -1) mixers.push(this.mixer);
        console.log(mixers);
        const clip = THREE.AnimationClip.findByName(this.obj.animations, name);
        console.log(clip);
        if (!clip) throw new Error("Animation clip not found");
        const action = this.mixer.clipAction(clip); // 返回动画操作器对象
        action.clampWhenFinished = true; // 动画结束后保持最后一帧
        action.loop = THREE.LoopOnce; // 只播放一次
        action.play();
    }
}

document.addEventListener("DOMContentLoaded", LoadTHREE())

function LoadTHREE() {
    // 创建世界
    initScene();
    // 渲染器
    initRenderer();
    // 灯光
    initLight();
    // 相机
    camera = initCamera();
    // 天空盒纹理加载
    // initSkyBox();
    // 加载模型
    initModels();
    // 一些测试代码
    Test();
    // 帧渲染
    animate();
}

function initScene() {
    // 动画场景初始化
    scene = new THREE.Scene();
}



function initRenderer() {
    // 渲染器初始化
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
}
function initLight() {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    // 平行光源
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5); // 第一个参数是颜色，第二个参数是光照强度
    directionalLight.position.set(1, 1, 1); // 设置光源位置
    scene.add(directionalLight);
    gui.add(directionalLight, 'intensity', 0, 10).name("光照强度");
    gui.add(directionalLight.position, 'y', -100, 1000).name("光源高度").step(0.1);
    scene.add(directionalLight);
}

function initSkyBox() {
    const skyloader = new THREE.TextureLoader();
    const texture = skyloader.load(
        'models/metro.jpg',
        () => {
            texture.mapping = THREE.EquirectangularRefractionMapping;
            texture.colorSpace = THREE.SRGBColorSpace;
            scene.background = texture;
        }
    )
}

function initModels() {
    // ? 路径稳定后通过数组传入，现在写死
    const loader = new LoadModel(scene);
    for (let path of modelPath) {
        loader.loadModel(path);
    }
}


const deltaTime = 0.01;
// render
function animate() {
    checkAnimation();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

function checkAnimation() {
    mixers.map(mixer => mixer.update(deltaTime));
}

// 创建一个对象来存储控制参数
var controls = {
    scale: 1
};

// ! 测试

function Test() {
    // 添加一个无限大的平面
    const planeGeometry = new THREE.PlaneGeometry(10000, 10000);
    const planeMaterial = new THREE.MeshBasicMaterial({ color: "gray" });
    const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
    planeMesh.rotation.x = -Math.PI / 2;
    scene.add(planeMesh);
    setTimeout(() => {
        test01();
    }, 2000);
}

async function test01() {
    console.log(models);
    AntiVisible(models["dcc800_0524_1"].obj);
    changeGeomtry(models);
    // ChangeTexture(models);
    PositionAdd("行车");
    // 经过测试厂房的最佳高度为-200
    models["Warahouse"].obj.position.y = -200;
    models["car"].obj.position.x = 200;
    models["car"].obj.scale.set(0.2, 0.2, 0.2);
    models["保温炉"].obj.position.set(200, 0, -100);
    await models["模具"].moveStraight(433, [0, -1, 0]); // 这是一个上模具的动作
    await models["模具"].moveStraight(433, [0, 1, 0]); // 这是一个下模具的动作
    // await models["car"].moveStraight(100, [1, 0, 0]);s
    // await models["car"].rotate(Math.PI / 2);
    // models["car"].animationPlay("Cube_13_2|Cube_13_2Action");
    // models["car"].moveStraight(100, [0, 0, -1]);

    // PositionAdd("给汤机_animation");
}

function PositionAdd(name) {
    gui.add(models[name].obj.position, 'x', -200, 200).name(name + "x坐标").onChange((value) => {
        models[name].obj.position.x = value;
    })
    gui.add(models[name].obj.position, 'y', -200, 2000).name(name + "y坐标").step(1).onChange((value) => {
        models[name].obj.position.y = value;
    })
    gui.add(models[name].obj.position, 'z', -100, 100).name(name + "z坐标").step(1).onChange((value) => {
        models[name].obj.position.z = value;
    })
    gui.add(controls, 'scale', 0, 1).name(name + "缩放").step(0.01).onChange((value) => {
        models[name].obj.scale.set(value, value, value);
    })
}