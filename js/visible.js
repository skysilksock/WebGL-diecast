import * as THREE from 'three';

const antiVisble = [
    "ZQ800-C483003-1#³é·çÕÖ½Ó¿Ú_15", // 遮风罩
    "PRESTIGE_DCC800-C483003-01#Õ¹ÀÀ»úîÓ½ð×Ü×°_14", // 侧面挡板
    "PRESTIGE_DCC800ÅçÎíM-710iC×Ü×°_13", // 喷雾机器人
    "Í¹Ì¨-À­Éì10", // 前板
    "ÇÐ³ý-À­Éì151", // 尾板哥林柱
]

const scaleChange = {
    "Warahouse": 0.4,
    "产品": 0.15,
    "car": 0.2,
    "行车": 0.15,
    "给汤机_animation": 0.01,
    "模具1": 0.08,
    "模具2": 0.08
}

const positionChange = {
    "Warahouse": [0, -60, -60],
    "产品": [7, 40, -14],
    "保温炉": [100, 0, -200],
    "car": [-100, 0, 200],
    // "行车": [4, 520, -20], // 适配厂房高度
    "行车": [4, 306, -20], // 合理高度
    "给汤机_animation": [30, 62, -98],
    "模具2": [5, 46, -32],
    // "模具1": [5, 460, -32], // 适配厂房高度
    "模具1": [5, 246, -32], // 合理高度
}

const TextureLoader = new THREE.TextureLoader();
const textChange = {
    "行车": "./models/行车纹理.png"
}

export function AntiVisible(obj) {
    for (const child of obj.children) {
        if (antiVisble.indexOf(child.name) != -1) {
            console.log(child.name);
            child.visible = false
        }
    }
}

export function changeGeomtry(models) {
    for (const [k, v] of Object.entries(models)) {
        if (scaleChange.hasOwnProperty(k)) {
            v.obj.scale.set(scaleChange[k], scaleChange[k], scaleChange[k]);
        }
        if (positionChange.hasOwnProperty(k)) {
            v.obj.position.set(positionChange[k][0], positionChange[k][1], positionChange[k][2]);
        }
    }
}

export function ChangeTexture(models) {
    for (const [k, v] of Object.entries(models)) {
        if (textChange.hasOwnProperty(k)) {
            TextureLoader.load(textChange[k], function (texture) {
                v.obj.material.map = texture;
                v.obj.material.needsUpdate = true;
            });
        }
    }
}