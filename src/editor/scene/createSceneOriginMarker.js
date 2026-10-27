import * as THREE from "three";

export function createSceneOriginMarker({ size = 0.4, colour = 0xa78bfa, opacity = 0.85 } = {}) {
    const group = new THREE.Group();

    const halfSize = size * 0.5;
    const labelOffset = 0.002;
    const labelSize = size * 0.65;

    // Invisible solid cube used only for depth, so rear labels are hidden.
    const depthCube = new THREE.Mesh(
        new THREE.BoxGeometry(size, size, size),
        new THREE.MeshBasicMaterial({
            colorWrite: false,
            depthWrite: true,
        }),
    );

    group.add(depthCube);

    // Visible wireframe cube.
    const wireframe = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(size, size, size)),
        new THREE.LineBasicMaterial({
            color: colour,
            transparent: true,
            opacity,
        }),
    );

    group.add(wireframe);

    const labelDefinitions = [
        {
            position: [0, 0, halfSize + labelOffset],
            rotation: [0, 0, 0], // front
        },
        {
            position: [0, 0, -halfSize - labelOffset],
            rotation: [0, Math.PI, 0], // back
        },
        {
            position: [halfSize + labelOffset, 0, 0],
            rotation: [0, Math.PI / 2, 0], // right
        },
        {
            position: [-halfSize - labelOffset, 0, 0],
            rotation: [0, -Math.PI / 2, 0], // left
        },
        {
            position: [0, halfSize + labelOffset, 0],
            rotation: [-Math.PI / 2, 0, 0], // top
        },
        {
            position: [0, -halfSize - labelOffset, 0],
            rotation: [Math.PI / 2, 0, 0], // bottom
        },
    ];

    labelDefinitions.forEach(({ position, rotation }) => {
        const label = createZeroFace({
            size: labelSize,
            colour,
            opacity,
        });

        label.position.set(...position);
        label.rotation.set(...rotation);

        group.add(label);
    });

    group.position.set(0, 0, 0);
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

function createZeroFace({ size, colour, opacity }) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = 256;
    canvas.height = 256;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = "bold 180px system-ui, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";

    const colourHex = `#${colour.toString(16).padStart(6, "0")}`;

    context.lineWidth = 14;
    context.strokeStyle = "rgba(0, 0, 0, 0.35)";
    context.strokeText("0", canvas.width * 0.5, canvas.height * 0.53);

    context.fillStyle = colourHex;
    context.fillText("0", canvas.width * 0.5, canvas.height * 0.53);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;

    const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity,
        side: THREE.FrontSide,
        depthTest: true,
        depthWrite: false,
    });

    const geometry = new THREE.PlaneGeometry(size, size);

    return new THREE.Mesh(geometry, material);
}
