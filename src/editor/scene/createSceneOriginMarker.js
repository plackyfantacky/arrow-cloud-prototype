import * as THREE from "three";

export function createSceneOriginMarker({ size = 2, colour = 0xa78bfa, opacity = 0.85 } = {}) {
    const group = new THREE.Group();

    const arrowDefinitions = [
        { label: "+x", rotation: 0, position: [1, 0] },
        { label: "-x", rotation: Math.PI, position: [-1, 0] },
        { label: "+z", rotation: -Math.PI / 2, position: [0, 1] },
        { label: "-z", rotation: Math.PI / 2, position: [0, -1] },
    ];

    arrowDefinitions.forEach(({ label, rotation, position }) => {
        const arrow = createArrowOutline({ size, colour, opacity });

        arrow.rotation.y = rotation;
        group.add(arrow);

        const axisLabel = createAxisLabel({
            text: label,
            size: size * 0.18,
            opacity,
        });

        axisLabel.position.set(position[0] * size * 0.26, 0.002, position[1] * size * 0.26);

        group.add(axisLabel);
    });

    group.position.set(0, 0.01, 0);
    group.userData.editorHelper = true;

    group.dispose = () => {
        group.traverse((object) => {
            object.geometry?.dispose();

            if (object.material) {
                const materials = Array.isArray(object.material) ? object.material : [object.material];

                materials.forEach((material) => {
                    material.map?.dispose();
                    material.dispose();
                });
            }
        });
    };

    return group;
}

function createArrowOutline({ size, colour, opacity }) {
    // One arrow pointing towards +X, with space around the origin.
    const points = [
        [0.07, -0.07],
        [0.3, -0.07],
        [0.3, -0.16],
        [0.5, 0],
        [0.3, 0.16],
        [0.3, 0.07],
        [0.07, 0.07],
    ];

    const geometry = new THREE.BufferGeometry().setFromPoints(points.map(([x, z]) => new THREE.Vector3(x * size, 0, z * size)));

    const material = new THREE.LineBasicMaterial({
        color: colour,
        transparent: true,
        opacity,
    });

    return new THREE.Line(geometry, material);
}

function createAxisLabel({ text, size, opacity }) {
    const canvas = document.createElement("canvas");

    canvas.width = 256;
    canvas.height = 256;

    const context = canvas.getContext("2d");

    context.font = "bold 110px system-ui, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "#ffffff";
    context.fillText(text, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);

    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;

    const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity,
        side: THREE.DoubleSide,
        depthWrite: false,
    });

    const label = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);

    label.rotation.x = -Math.PI / 2;

    return label;
}
