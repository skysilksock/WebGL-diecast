import './style.css';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { loadModels, meshs, bodys } from './src/load.js';

// 创建场景
const scene = new THREE.Scene();
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

// 渲染和物理世界
// 创建cannon-es-debugger实例
const debug = new CannonDebugger(scene, world, {
	color: 0xff0000,
	autoUpdate: true // 自动更新debugger视图
});


// renderer
const renderer = new THREE.WebGLRenderer();
// renderer.setSize(800, 600);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// render and physic
const sphereShape = new CANNON.Sphere(0.5);
const sphereBody = new CANNON.Body({
	mass: 1,
	shape: sphereShape,
	position: new CANNON.Vec3(0, 5, 0)
});
world.addBody(sphereBody);

const planeShape = new CANNON.Plane();
const planeBody = new CANNON.Body({
	mass: 0,
	shape: planeShape,
	position: new CANNON.Vec3(0, 0, 0),
	type: CANNON.Body.STATIC
})
console.log(planeBody);
planeBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
world.addBody(planeBody);

const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x3f });
const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add(sphereMesh);

const planeGeometry = new THREE.PlaneGeometry(10000, 10000);
const planeMaterial = new THREE.MeshBasicMaterial({ color: "gray" });
const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
planeMesh.rotation.x = -Math.PI / 2;
scene.add(planeMesh);


// button
const button1 = document.createElement("button");
const button2 = document.createElement("button");
document.body.appendChild(button1);
document.body.appendChild(button2);
button1.textContent = "getValue";
button2.textContent = "jsFunc";
button1.onclick = getValue;
button2.onclick = jsFunc;


// 模型加载
{
	loadModels(scene, world);
	console.log("bodys", bodys);
	// 	const loader = new GLTFLoader();
	// 	loader.load("./models/Hinge1.glb", function (gltf) {
	// 		gltf.scene.traverse(function (child) {
	// 			if (child.isMesh) {
	// 				// 创建Three.js网格
	// 				const mesh = child;
	// 
	// 				// 获取模型的顶点和索引数据
	// 				const geometry = mesh.geometry;
	// 				const vertices = geometry.attributes.position.array;
	// 				const indices = geometry.index ? geometry.index.array : null;
	// 
	// 				// 创建Cannon.js物理体
	// 				const cannonShape = indices ? new CANNON.Trimesh(vertices, indices) : new CANNON.ConvexPolyhedron(vertices);
	// 
	// 				// 创建Cannon.js刚体
	// 				const body = new CANNON.Body({ mass: 1 });
	// 				body.addShape(cannonShape);
	// 				body.position.set(0, 20, 0);
	// 				world.addBody(body);
	// 			}
	// 		})
	// 	})
}



// gui.add(camera, 'fov', 1, 100).onChange(updateCamera).name("FOV").step(0.1);

// 灯光
{
	const ambient = new THREE.AmbientLight(0xffffff, 1.0);
	scene.add(ambient);
}

// 摄像机
const camera = new THREE.PerspectiveCamera(
	45, // FOV
	window.innerWidth / window.innerHeight,
	0.1,
	4000
);
camera.position.set(10, 10, 10);
// 设置相机控件轨道控制器OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
// 如果OrbitControls改变了相机参数，重新调用渲染器渲染三维场景
controls.addEventListener('change', function () {
	renderer.render(scene, camera); //执行渲染操作
});//监听鼠标、键盘事件

// 坐标系
{
	const axesHelper = new THREE.AxesHelper(1500);
	scene.add(axesHelper);
}
// 创建玩家模型
const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
const playerMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
// scene.add(playerMesh);

// 创建玩家刚体
const playerShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
const playerBody = new CANNON.Body({ mass: 1 });
playerBody.addShape(playerShape);
playerBody.position.set(0, 50, 0);
// world.addBody(playerBody);

// function updateCamera() {
// 	camera.updateProjectionMatrix();
// }

const pivotA = new CANNON.Vec3(0.5, 0, 0); // body1中的枢轴点
const pivotB = new CANNON.Vec3(-1, 0, 0); // body2相对于body1的枢轴点
const axis = new CANNON.Vec3(0, 0, 1); // 两个物体围绕旋转的轴
window.bodys = bodys;
setTimeout(() => {
	const hingeConstraint = new CANNON.HingeConstraint(bodys[0], bodys[1], {
		pivotA: pivotA,
		pivotB: pivotB,
		axisA: axis,
		axisB: axis,
		collideConnected: false
	});
	world.addConstraint(hingeConstraint);
}, 1000);

const clock = new THREE.Clock();
// render
function animate() {
	const deltaTime = clock.getDelta();
	world.step(1 / 60, deltaTime, 3);
	sphereMesh.position.copy(sphereBody.position);
	renderer.render(scene, camera);
	updatePlayer(playerBody);
	playerMesh.position.copy(playerBody.position);
	meshs.map((v, i) => {
		v.position.copy(bodys[i].position);
		v.quaternion.copy(bodys[i].quaternion);
	})
	debug.update();
	requestAnimationFrame(animate);
}
// hinge();

animate();

// 页面加载完成，执行函数
window.addEventListener("DOMContentLoaded", function () {
	// 创建Webchannel，与 Qt 端建立连接
	// qt.webChannelTransport 不用管，自动传过来
	new QWebChannel(qt.webChannelTransport, function (channel) {
		// 通过channel 获取Qt端的对象
		window.pyObj = channel.objects.backend;
		// Qt对象的note信号 连接到js的函数
		window.pyObj.note.connect(function (arg) {
			alert("qt信号触发js函数: ", arg);
			model.position.set(100, 300, 100);
			getValue();
		});
	});
})
export function jsFunc() {
	let data = {
		name: "backend",
		age: 90
	}
	// js 调用 qt 端的函数，并传入参数（json序列化的数据）
	window.pyObj.py_func(JSON.stringify(data))
}

function getValue() {
	// js调用qt对象的属性，获取数据
	let data = window.pyObj.name;
	model.position.y = data;
	alert("获取的python数据:" + data)
}



// 更新玩家状态
function updatePlayer(playerBody) {
	// 根据用户输入或其他条件更新玩家的状态
	// 这里仅作示例，你需要根据你的需求来实现玩家的移动和交互逻辑
	const speed = 0.01;
	window.addEventListener("keydown", function (e) {
		console.log(e);
		if (e.key === 'w') {
			playerBody.position.z -= speed;
		}
		if (e.key === 's') {
			playerBody.position.z += speed;
		}
		console.log(planeBody.position);
	})
}