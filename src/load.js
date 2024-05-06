import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { CubeTextureLoader } from 'three';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

const meshs = [];
const bodys = [];

function loadModels(scene, world) {
	const loader = new GLTFLoader();
	const dracoLoader = new DRACOLoader();
	// loader.load("./models/FabConvert.com_sw fbx.gltf", function (gltf) {
	//   gltf.scene.scale.set(0.02, 0.02, 0.02);
	//   gltf.scene.position.z = 200;
	//   console.log(gltf.scene);
	//   scene.add(gltf.scene);
	// })

	// const cubes = [
	// 	makeInstance( geometry, 0x44aa88, 0 ),
	// 	makeInstance( geometry, 0x8844aa, - 2 ),
	// 	makeInstance( geometry, 0xaa8844, 2 ),
	// ];

	function loadModel(path) {
		// dracoLoader.setDecoderPath("/examples/jsm/libs/draco/");
		// loader.setDRACOLoader(dracoLoader);
		loader.load(path, function (gltf) {
			console.log(path);
			console.log("gltf.scene", gltf.scene);
			scene.add(gltf.scene);
			return;
			gltf.scene.traverse(function (child) {
				if (child.isMesh) {
					// 创建Three.js网格
					const mesh = child;

					// 获取模型的顶点和索引数据
					const geometry = mesh.geometry;
					const vertices = geometry.attributes.position.array;
					const indices = geometry.index ? geometry.index.array : null;

					// 创建Cannon.js物理体
					const cannonShape = indices ? new CANNON.Trimesh(vertices, indices) : new CANNON.ConvexPolyhedron(vertices);

					// 创建Cannon.js刚体
					const body = new CANNON.Body({ mass: 1 });
					body.addShape(cannonShape);
					body.position.set(0, 20, 0);
					meshs.push(child);
					bodys.push(body);
					scene.add(child);
					world.addBody(body);
				}
			})
		})
	}
	// loadModel("./models/Hinge2.glb");
	// loadModel("./models/Hinge1.glb");
	loadModel("./models/car.glb");


	{

		// const skyloader = new THREE.CubeTextureLoader();
		// const texture = skyloader.load([
		// 	'models/top.png',
		// 	'models/sur1.png',
		// 	'models/sur2.png',
		// 	'models/sur3.png',
		// 	'models/sur4.png',
		// 	'models/bottom.png',
		// ]);
		// scene.background = texture;

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
}


// function makeInstance( geometry, color, x ) {
// 
// 	const material = new THREE.MeshPhongMaterial( { color } );
// 
// 	const cube = new THREE.Mesh( geometry, material );
// 	scene.add( cube );
// 
// 	cube.position.x = x;
// 
// 	return cube;
// 
// }

export { loadModels, meshs, bodys };