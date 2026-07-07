import * as THREE from 'three';
import { setupPathComponentMesh } from "./setupPathComponentMesh.js";
import { createPanelFallbackTexture } from "./createPanelFallbackTexture.js";

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

    if (component.face?.image || component.face?.fallbackImage !== false) {
        const imageSettings = component.face?.image || {};
        const fallbackTexture = createPanelFallbackTexture();

        const imagePadding = imageSettings.padding ?? 0.08;

        const availablePlaneX = Math.max(
            0.01,
            faceHeight - imagePadding * 2
        );

        const availablePlaneY = Math.max(
            0.01,
            faceWidth - imagePadding * 2
        );

        const rotationDegrees = imageSettings.rotationDegrees ?? 0;
        const normalisedRotation = Math.abs(rotationDegrees % 180);
        const isQuarterTurn = normalisedRotation === 90;

        const imageAspectRatio = imageSettings.aspectRatio ?? 1;

        const imageSize = getContainedImageSize({
            availablePlaneX: isQuarterTurn ? availablePlaneY : availablePlaneX,
            availablePlaneY: isQuarterTurn ? availablePlaneX : availablePlaneY,
            aspectRatio: imageAspectRatio,
        });

        const imageScale = imageSettings.scale ?? 1;

        const imageGeometry = new THREE.PlaneGeometry(
            imageSize.planeX * imageScale,
            imageSize.planeY * imageScale
        );

        const imageMaterial = new THREE.MeshBasicMaterial({
            map: fallbackTexture,
            transparent: true,
            alphaTest: 0.01,
            depthWrite: false,
            side: THREE.DoubleSide
        });

        if (imageSettings.src) {
            const textureLoader = new THREE.TextureLoader();

            textureLoader.load(
                imageSettings.src,
                (loadedTexture) => {
                    loadedTexture.colorSpace = THREE.SRGBColorSpace;

                    imageMaterial.map = loadedTexture;
                    imageMaterial.needsUpdate = true;
                },
                undefined,
                () => {
                    console.warn(`Could not load panel image: ${imageSettings.src}`);
                }
            );
        }

        const imageMesh = new THREE.Mesh(
            imageGeometry,
            imageMaterial
        );

        const imageOffset = imageSettings.offset || {};

        imageMesh.position.x = imageOffset.x || 0;
        imageMesh.position.y = (depth * 0.5) + 0.008;
        imageMesh.position.z = imageOffset.y || 0; //yes I'm aware.
            
        imageMesh.rotation.x = -Math.PI * 0.5;

        if (typeof imageSettings.rotationDegrees === 'number') {
            imageMesh.rotation.z = THREE.MathUtils.degToRad(
                imageSettings.rotationDegrees
            );
        }

        faceGroup.add(imageMesh);
    }

    mesh.add(faceGroup);

    return setupPathComponentMesh(mesh, component);
}