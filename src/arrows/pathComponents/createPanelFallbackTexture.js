import * as THREE from "three";

let fallbackTexture = null;

export function createPanelFallbackTexture() {
    if (fallbackTexture) {
        return fallbackTexture;
    }

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    canvas.width = 512;
    canvas.height = 512;

    context.clearRect(0, 0, canvas.width, canvas.height);

    context.strokeStyle = '#ffffff';
    context.lineWidth = 28;
    context.lineCap = 'round';
    context.lineJoin = 'round';

    context.beginPath();
    context.moveTo(190, 170);
    context.lineTo(120, 256);
    context.lineTo(190, 342);
    context.stroke();

    context.beginPath();
    context.moveTo(322, 170);
    context.lineTo(392, 256);
    context.lineTo(322, 342);
    context.stroke();

    context.beginPath();
    context.moveTo(286, 142);
    context.lineTo(226, 370);
    context.stroke();

    fallbackTexture = new THREE.CanvasTexture(canvas);
    fallbackTexture.colorSpace = THREE.SRGBColorSpace;
    fallbackTexture.minFilter = THREE.LinearFilter;
    fallbackTexture.magFilter = THREE.LinearFilter;
    fallbackTexture.generateMipmaps = false;

    return fallbackTexture;
}