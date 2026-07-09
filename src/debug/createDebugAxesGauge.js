import * as THREE from "three";

function createAxisLabel(text, position) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = 256;
    canvas.height = 128;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = "bold 72px system-ui, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";

    context.lineWidth = 8;
    context.strokeStyle = "rgba(0, 0, 0, 0.75)";
    context.strokeText(text, canvas.width * 0.5, canvas.height * 0.5);

    context.fillStyle = "#000000";
    context.fillText(text, canvas.width * 0.5, canvas.height * 0.5);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;

    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
    });

    const sprite = new THREE.Sprite(material);

    sprite.position.copy(position);
    sprite.scale.set(0.45, 0.225, 1);

    return sprite;
}

export function createDebugAxesGauge({
    size = 2,
    labelOffset = 0.35,
} = {}) {
    const group = new THREE.Group();
    const axesGauge = new THREE.AxesHelper(size);
    const labelDistance = size + labelOffset;

    group.add(axesGauge);

    group.add(createAxisLabel(
        "X",
        new THREE.Vector3(labelDistance, 0, 0)
    ));

    group.add(createAxisLabel(
        "Y",
        new THREE.Vector3(0, labelDistance, 0)
    ));

    group.add(createAxisLabel(
        "Z",
        new THREE.Vector3(0, 0, labelDistance)
    ));

    return group;
}