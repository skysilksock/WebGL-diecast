import { PerspectiveCamera } from "three";
import { Vector3 } from "three";

export function initCamera() {
    // 相机初始化
    const camera = new PerspectiveCamera(
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
            const cameraDirection = new Vector3();
            camera.getWorldDirection(cameraDirection);
            const [dx, dy, dz] = [cameraDirection.x, cameraDirection.y, cameraDirection.z];
            cameraMove(dx, dy, dz);
        } else if (event.key === 's') {
            const cameraDirection = new Vector3();
            camera.getWorldDirection(cameraDirection);
            const [dx, dy, dz] = [cameraDirection.x, cameraDirection.y, cameraDirection.z];
            cameraMove(-dx, -dy, -dz);
        }
        if (event.key === 'd') {
            // 获取物体的右向量
            let rightVector = new Vector3(1, 0, 0);
            rightVector.applyQuaternion(camera.quaternion);
            const [dx, dy, dz] = rightVector;
            cameraMove(dx, dy, dz);
        } else if (event.key === 'a') {
            // 获取物体的左向量
            let leftVector = new Vector3(-1, 0, 0);
            leftVector.applyQuaternion(camera.quaternion);
            const [dx, dy, dz] = leftVector
            cameraMove(dx, dy, dz);
        }
        if (event.key === 'h') {
            camera.position.y += cameraSpeed;
        }
    });

    document.addEventListener('wheel', function (event) {
        const cameraDirection = new Vector3();
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
    return camera;
}