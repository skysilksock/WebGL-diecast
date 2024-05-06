import './style.css';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';



// 公共变量
let scene = null;
let camera = null
let renderer = null;
const gui = new GUI();
let mixer = null;
// const fbxLoader = new FBXLoader();
// const gltfLoader = new GLTFLoader();
// const modelPath = ['./models/LK/dcc800_0524_1.fbx', './models/LK/factory1.obj', './models/LK/Warahouse.fbx', './models/LK/上部防护罩.fbx', './models/LK/侧面围挡+门.fbx', './models/LK/保温炉.fbx', './models/LK/压射杆后端2 1.fbx', './models/LK/压射杆后端2.fbx', './models/LK/压铸机_喷雾机器人.fbx', './models/LK/尾板+哥林柱2.fbx', './models/LK/活塞杆后端.fbx', './models/LK/给汤机_坐标调整.fbx'];
const modelPath =
    [
        './models/LK/dcc800_0524_1.fbx',
        './models/LK/factory1.obj',
        './models/LK/Warahouse.fbx',
        "./models/LK/保温炉.fbx",
        "./models/LK/给汤机_坐标调整.fbx",
        "./models/car.fbx"
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
    }
    moveStraight(length) {
        const time = setInterval(() => {
            this.obj.position.z += this.speed;
            length -= this.speed;
            if (length <= 0) clearInterval(time);
        }, 1);
    }

    rotate(angle) {
        // 正数逆时针转，负数顺时针转
        const time = setInterval(() => {
            this.obj.rotation.y += this.speed;
            angle -= this.speed;
            if (angle <= 0) clearInterval(time);
        }, 1);
    }

    animationPlay(name) {
        const clip = THREE.AnimationClip.findByName(this.obj.animations, name);
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
    initCamera();
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

function initCamera() {
    // 相机初始化
    camera = new THREE.PerspectiveCamera(
        45, // FOV
        window.innerWidth / window.innerHeight,
        0.1,
        4000
    );
    camera.position.set(100, 100, 100);

    // ? 监听鼠标、键盘事件
    let cameraSpeed = 10;
    function cameraMove(dx, dy, dz) {
        camera.position.x += dx * cameraSpeed;
        camera.position.y += dy * cameraSpeed;
        camera.position.z += dz * cameraSpeed;
    }

    document.addEventListener('keydown', function (event) {
        if (event.key === 'w') {
            const cameraDirection = new THREE.Vector3();
            camera.getWorldDirection(cameraDirection);
            const [dx, dy, dz] = [cameraDirection.x, cameraDirection.y, cameraDirection.z];
            cameraMove(dx, dy, dz);
        } else if (event.key === 's') {
            const cameraDirection = new THREE.Vector3();
            camera.getWorldDirection(cameraDirection);
            const [dx, dy, dz] = [cameraDirection.x, cameraDirection.y, cameraDirection.z];
            cameraMove(-dx, -dy, -dz);
        }
        if (event.key === 'd') {
            // 获取物体的右向量
            let rightVector = new THREE.Vector3(1, 0, 0);
            rightVector.applyQuaternion(camera.quaternion);
            const [dx, dy, dz] = rightVector;
            cameraMove(dx, dy, dz);
        } else if (event.key === 'a') {
            // 获取物体的左向量
            let leftVector = new THREE.Vector3(-1, 0, 0);
            leftVector.applyQuaternion(camera.quaternion);
            const [dx, dy, dz] = leftVector
            cameraMove(dx, dy, dz);
        }
        if (event.key === 'h') {
            camera.position.y += cameraSpeed;
        }
    });

    document.addEventListener('wheel', function (event) {
        const cameraDirection = new THREE.Vector3();
        camera.getWorldDirection(cameraDirection);
        const [dx, dy, dz] = [cameraDirection.x, cameraDirection.y, cameraDirection.z].map(x => x * 0.1);
        console.log("dxdydz", dx, dy, dz);
        camera.position.x += event.deltaY * -dx;
        camera.position.y += event.deltaY * -dy;
        camera.position.z += event.deltaY * -dz;
    });

    let isDragging = false;

    document.addEventListener('mousedown', function (e) {
        isDragging = true;
    });
    document.addEventListener('mousemove', (event) => {
        //鼠标左键按下时候，才旋转玩家角色
        if (isDragging) {
            camera.rotation.y -= event.movementX / 600;
        }
    });
    document.addEventListener('mouseup', function (e) {
        isDragging = false;
    });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

}

function initRenderer() {
    // 渲染器初始化
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
}
function initLight() {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
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
    if (mixer) mixer.update(deltaTime);
}

// 创建一个对象来存储控制参数
var controls = {
    scale: 1
};

function initAnimation() {
    // 改变叉车整体缩放，添加gui控制

    gui.add(controls, 'scale', 0, 1).onChange((value) => {
        models["car"].obj.scale.set(value, value, value);
    })
    gui.add(models["car"].obj.rotation, 'y', -3.14, 3.14).step(0.01);
    mixer = new THREE.AnimationMixer(models["car"].obj);
    const clip = THREE.AnimationClip.findByName(models["car"].obj.animations, "Cube_13_2|Cube_13_2Action");
    const AnimationAction = mixer.clipAction(clip).play();
    AnimationAction.clampWhenFinished = true;
    AnimationAction.loop = THREE.LoopOnce;
    AnimationAction.play();

    // 添加动画播放完成事件监听器
    mixer.addEventListener('finished', function (event) {
        // 当动画播放完成时，切换动画播放方向并重新播放动画
        var animationAction = event.action; // 获取触发事件的动画动作

        // 切换动画的播放方向
        if (animationAction.timeScale > 0) {
            animationAction.timeScale = -1; // 反向播放
        } else {
            animationAction.timeScale = 1; // 正向播放
        }

        animationAction.paused = false; // 重新播放动画
    });
}

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
    }, 5000);
}

function test01() {
    initAnimation();
    // gui.add(camera, 'fov', 1, 100).onChange(updateCamera).name("FOV").step(0.1);
    // 经过测试厂房的最佳高度为-200
    models["Warahouse"].obj.position.y = -200;
    models["car"].obj.position.x = 200;
    models["car"].obj.scale.set(0.2, 0.2, 0.2);
    models["保温炉"].obj.position.set(200, 0, -100);
    gui.add(models["保温炉"].obj.position, 'x', -200, 200).name("保温炉x坐标").onChange((value) => {
        models["保温炉"].obj.position.x = value;
    })
    gui.add(models["保温炉"].obj.position, 'y', -200, 200).name("保温炉y坐标").onChange((value) => {
        models["保温炉"].obj.position.y = value;
    })
}