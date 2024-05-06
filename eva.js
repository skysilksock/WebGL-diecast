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
                    models[modelname] = obj;
                    this.scene.add(obj);
                    this.fbxLoader.parse(obj, (res) => {
                        console.log(res);
                    })
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
                    models[modelname] = obj.scene;
                    this.scene.add(obj.scene);
                })
                break;
        }
    }
}

class Model {
    constructor(obj, speed = 0.1) {
        this.obj = obj;
        this.speed = speed;
    }
    moveStraight(length) {
        const time = setInterval(() => {
            this.obj.position.z += this.speed;
            length -= this.speed;
            if (length <= 0) clearInterval(time);
        }, 1);
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

    // ? 相机控件操控镜头
    // // 设置相机控件轨道控制器OrbitControls
    // const controls = new OrbitControls(camera, renderer.domElement);
    // // 如果OrbitControls改变了相机参数，重新调用渲染器渲染三维场景
    // controls.addEventListener('change', function () {
    //     renderer.render(scene, camera); //执行渲染操作
    // });

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
    let previousMousePosition = {
        x: 0,
        y: 0
    };
    // let minVerticalRotation = -Math.PI / 2 + 0.01; // 最小垂直旋转角度
    // let maxVerticalRotation = Math.PI / 2 - 0.01;  // 最大垂直旋转角度

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
    gui.add(directionalLight, 'intensity', 0, 10000).name("光照强度");
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


// render
function animate() {
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
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
    }, 1000);
}

function test01() {
    console.log(models["Warahouse"]);
    // gui.add(camera, 'fov', 1, 100).onChange(updateCamera).name("FOV").step(0.1);
    // 经过测试厂房的最佳高度为-200
    models["Warahouse"].position.y = -200;
    models["保温炉"].position.set(200, 0, -100);
    gui.add(models["保温炉"].position, 'x', -200, 200).onChange((value) => {
        models["保温炉"].position.x = value;
    })
    gui.add(models["保温炉"].position, 'y', -200, 200).onChange((value) => {
        models["保温炉"].position.y = value;
    })
}