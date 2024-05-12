import './style.css';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';
// import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { abs } from 'three/examples/jsm/nodes/Nodes.js';

// my module
import { AntiVisible, changeGeomtry } from './js/visible.js';
import { LoadModel, ModelControler } from './js/common.js';
import { models, mixers, scene, camera, renderer, gui } from './js/common.js';




const modelPath =
    [
        // "./models/给汤机_坐标调整_--.fbx",
        "./models/行车.fbx",
        './models/LK/dcc800_0524_1.fbx',
        // './models/LK/dcc800.glb',
        './models/LK/Warahouse.fbx',
        "./models/LK/保温炉.fbx",
        "./models/car.fbx",
        "./models/给汤机_animation.fbx",
        "./models/产品.fbx",
        "./models/模具1.fbx",
        "./models/模具2.fbx",
    ]


document.addEventListener('DOMContentLoaded', LoadTHREE);

async function LoadTHREE() {
    // 灯光
    initLight();
    // 天空盒纹理加载
    // initSkyBox();
    // 加载模型
    await initModels();
    // 一些测试代码
    Test();
    // 帧渲染
    animate();
}

function initLight() {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    // 平行光源
    const directionalLight = new THREE.DirectionalLight(0xffffff, 3); // 第一个参数是颜色，第二个参数是光照强度
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

async function initModels() {
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
const controls = {
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
    // document.addEventListener("click", onMouseClick); // 点击高亮物体
    setTimeout(test01, 5000);
}

const actions = {
    "给汤": async function geitang() {
        console.log("给汤");
        // 给汤
        CameraSet([146, 70, -135], [0, 2, 0]);
        await models["给汤机_animation"].animationPlay("骨架|骨架Action", true);
        await models["给汤机_animation"].rotate(Math.PI / 4);
        await models["给汤机_animation"].animationPlay("骨架|骨架Action", true);
        camera.rotation.set(0, 1.5, 0);
        camera.position.set(537, 120, 24);
    },
    "开模": function kaimo() {
        console.log("开模");
        models["PRESTIGE_DCC800ÖÐ°å_20"].moveStraight(-20);
        models["模具2"].moveStraight(20, [0, 0, 1]);
    },
    "上模具": async function shangmou() {
        console.log("上模具");
        await models["模具1"].moveStraight(124, [0, -1, 0]);
    },
    "合模": async function hemo() {
        console.log("合模");
        models["PRESTIGE_DCC800ÖÐ°å_20"].moveStraight(20);
        models["模具2"].moveStraight(20, [0, 0, -1]);
    },
    "压铸": function () {
        console.log("压铸");
        models["产品"].obj.visible = true;
    },
    "产品取出": async function chanpinquchu() {
        console.log("产品取出");
        await models["产品"].moveStraight(60, [0, 1, 0]);
        await models["产品"].moveStraight(100, [-1, 0, 0]);
        await models["产品"].moveStraight(100, [0, -1, 0]);
    },
    "叉车运送产品": async function chacheyunsong() {
        console.log("叉车运送产品");
        await models["car"].rotate(-Math.PI / 2);
        await models["car"].moveStraight(165, [0, 0, -1]);
        await Promise.all([
            models["car"].animationPlay("Cube_13_2|Cube_13_2Action", true),
            models["产品"].moveStraight(68, [0, 1, 0], 950)
        ]);
        await Promise.all([
            models["car"].moveStraight(220, [0, 0, -1]),
            models["产品"].moveStraight(220, [0, 0, -1])
        ])
        await Promise.all([
            models["car"].animationPlay("Cube_13_2|Cube_13_2Action", true),
            models["产品"].moveStraight(68, [0, -1, 0], 850)
        ]);
    }
}

const situationControl = {
    curStep: 0,
    functions: Object.values(actions),
    steps: [0, 1, 2, 3, 4, 1, 5, 6],
    executeCode: function () {
        if (this.curStep >= this.steps.length) alert("执行完成，妖魔鬼怪快离开！");
        console.log(this.functions);
        this.functions[this.steps[this.curStep]]();
        this.curStep++;
    }
}

async function test01() {
    console.log(models); // 调试代码
    gui.add(situationControl, "executeCode").name("执行代码");
    AntiVisible(models["dcc800_0524_1"].obj); // 隐藏模型的部分零件
    changeGeomtry(models); // 调整场景中模型的缩放位置
    dfs(models["dcc800_0524_1"].obj, ""); // 拿到所需的主机的部分零件集合
    models["产品"].obj.visible = false; // 初始时产品不可见
}

function PositionAdd(name) {
    gui.add(models[name].obj.position, 'x', -100, 200).name(name + "x坐标").step(1).onChange((value) => {
        models[name].obj.position.x = value;
    })
    gui.add(models[name].obj.position, 'y', -200, 300).name(name + "y坐标").step(1).onChange((value) => {
        models[name].obj.position.y = value;
    })
    gui.add(models[name].obj.position, 'z', -800, 200).name(name + "z坐标").step(1).onChange((value) => {
        models[name].obj.position.z = value;
    })
    gui.add(controls, 'scale', 4, 10).name(name + "缩放").step(0.01).onChange((value) => {
        models[name].obj.scale.set(value, value, value);
    })
}

function CameraSet(pos, rotate) {
    camera.position.set(pos[0], pos[1], pos[2]);
    camera.rotation.set(rotate[0], rotate[1], rotate[2]);
}

function onMouseClick(event) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    // 计算鼠标点击位置的归一化坐标
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // 更新射线投射器的方向
    raycaster.setFromCamera(mouse, camera);

    // 执行射线投射
    const intersects = raycaster.intersectObjects(scene.children);

    // 如果有物体被点击到，处理点击事件
    // const clickedObject = intersects[0].object;

    // 在这里添加处理点击物体的代码，例如显示详细信息等
    for (let clickedObject of intersects) {
        console.log(clickedObject);
        highlightObject(clickedObject.object);
        break;
    }
}

// 高亮显示点击到的物体
function highlightObject(object) {
    // 将原始材质保存下来，以便恢复
    const originalMaterial = object.material;

    // 创建高亮材质
    const highlightMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

    // 将物体的材质替换为高亮材质
    object.material = highlightMaterial;

    // 1秒后恢复原始材质
    setTimeout(() => {
        object.material = originalMaterial;
    }, 1000);
}

const controlMachine = [
    "Í¹Ì¨-À­Éì10", //  前板 网格
    "ÇÐ³ý-À­Éì151", // 尾板哥林柱 网格
    "PRESTIGE_DCC800ÖÐ°å_20", // 中板 集合

]

function dfs(obj, cur) {
    if (obj.children.length == 0) {
        // 捕捉网格
        if (controlMachine.indexOf(obj.name) != -1) {
            models[obj.name] = new ModelControler(obj);
        }
        return;
    }
    for (let child of obj.children) {
        dfs(child, cur + obj.name + "->");
        // 捕捉集合
        if (controlMachine.indexOf(obj.name) != -1) {
            models[obj.name] = new ModelControler(obj);
        }
    }
}

export { mixers, models };