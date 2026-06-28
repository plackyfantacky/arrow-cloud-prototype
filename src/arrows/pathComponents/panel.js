import * as THREE from 'three';
import { setupPathComponentMesh } from "./setupPathComponentMesh.js";

function getContainedImageSize({
    availablePlaneX,
    availablePlaneY,
    aspectRatio,
}) {
    let planeX = availablePlaneX;
    let planeY = planeX / aspectRatio;

    if (planeY > availablePlaneY) {
        planeY = availablePlaneY;
        planeX = planeY * aspectRatio;
    }

    return {
        planeX,
        planeY,
    };
}

export function createPanelPathComponent(component) {
    const width = component.size?.width || 1;
    const height = component.size?.height || 1;
    const depth = component.size?.depth || 0.1;

    const geometry = new THREE.BoxGeometry(
        height,
        depth, 
        width
    );

    const material = new THREE.MeshStandardMaterial({
        color: 0xff9d2a,
        roughness: 0.5,
        metalness: 0.1,
        flatShading: true
    });

    const mesh = new THREE.Mesh(geometry, material);

    const frameThickness = component.frameThickness ?? 0.12;

    const faceWidth = Math.max(0.01, width - frameThickness * 2);
    const faceHeight = Math.max(0.01, height - frameThickness * 2);

    const faceGroup = new THREE.Group();
    
    const backgroundGeometry = new THREE.PlaneGeometry(
        faceHeight,
        faceWidth
    );

    const backgroundMaterial = new THREE.MeshBasicMaterial({
        color: component.face?.color ?? 0xff9d2a,
        side: THREE.DoubleSide
    });

    const backgroundMesh = new THREE.Mesh(
        backgroundGeometry,
        backgroundMaterial
    );

    backgroundMesh.position.y = (depth * 0.5) + 0.002;
    backgroundMesh.rotation.x = -Math.PI * 0.5;

    faceGroup.add(backgroundMesh);

    if (component.face?.image?.src) {
        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load(component.face.image.src);

        texture.colorSpace = THREE.SRGBColorSpace;

        const imagePadding = component.face.image.padding ?? 0.08;

        const availablePlaneX = Math.max(
            0.01,
            faceHeight - imagePadding * 2
        );

        const availablePlaneY = Math.max(
            0.01,
            faceWidth - imagePadding * 2
        );

        const rotationDegrees = component.face.image.rotationDegrees ?? 0;
        const normalisedRotation = Math.abs(rotationDegrees % 180);
        const isQuarterTurn = normalisedRotation === 90;

        const imageAspectRatio = component.face.image.aspectRatio ?? 1;

        const imageSize = getContainedImageSize({
            availablePlaneX: isQuarterTurn ? availablePlaneY : availablePlaneX,
            availablePlaneY: isQuarterTurn ? availablePlaneX : availablePlaneY,
            aspectRatio: imageAspectRatio,
        });

        const imageScale = component.face.image.scale ?? 1;

        const imageGeometry = new THREE.PlaneGeometry(
            imageSize.planeX * imageScale,
            imageSize.planeY * imageScale
        );

        const imageMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            alphaTest: 0.01,
            depthWrite: false,
            side: THREE.DoubleSide
        });

        const imageMesh = new THREE.Mesh(
            imageGeometry,
            imageMaterial
        );

        const imageOffset = component.face.image.offset || {};

        imageMesh.position.x = imageOffset.x || 0;
        imageMesh.position.y = (depth * 0.5) + 0.008;
        imageMesh.position.z = imageOffset.y || 0; //yes I'm aware.
        
        imageMesh.rotation.x = -Math.PI * 0.5;

        if (typeof component.face.image.rotationDegrees === 'number') {
            imageMesh.rotation.z = THREE.MathUtils.degToRad(
                component.face.image.rotationDegrees
            );
        }

        faceGroup.add(imageMesh);
    }

    mesh.add(faceGroup);

    return setupPathComponentMesh(mesh, component);
}