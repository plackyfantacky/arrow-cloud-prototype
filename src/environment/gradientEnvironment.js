import * as THREE from "three";

export function createGradientEnvironment(scene, settings) {
    
    const canvas = document.createElement('canvas');

    canvas.width = 256;
    canvas.height = 256;

    const context = canvas.getContext('2d');

    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);

    gradient.addColorStop(0, settings.startColour ?? '#F7B76A');
    gradient.addColorStop(1, settings.endColour ?? '#CB6B2D');

    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    
    texture.colorSpace = THREE.SRGBColorSpace;

    scene.background = texture;

    const groundGeometry = new THREE.PlaneGeometry(200, 200);

    const groundMaterial = new THREE.MeshStandardMaterial({
        color: settings.groundColour ?? '#CB743F',
        side: THREE.DoubleSide
    });

    const ground = new THREE.Mesh(
        groundGeometry,
        groundMaterial
    );

    ground.rotation.x = -Math.PI / 2;
    ground.position.y = settings.groundHeight ?? -2;

    ground.receiveShadow = true;
    ground.userData.cameraTargetCollision = false;

    scene.add(ground);

    console.log('Ground settings:', {
        configured: settings.groundColour,
        material: groundMaterial.color.getHexString()
    });

    console.log('Gradient environment settings:', settings);

    return ground;
}