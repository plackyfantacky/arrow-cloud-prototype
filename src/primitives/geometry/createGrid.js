import * as THREE from "three";

export function createGrid({
    width,
    height,
    columns,
    rows,
    colour = '#F99D2A',
    opacity = 1
}) {

    const vertices = [];

    //vertical lines
    for (let i = 0; i <= columns; i++) {
        const x = -width / 2 + (i / columns) * width;

        vertices.push(
            x, 0, -height / 2,
            x, 0, height / 2
        );
    }

    //horizontal lines
    for (let j = 0; j <= rows; j++) {
        const z = -height / 2 + (j / rows) * height;

        vertices.push(
            -width / 2, 0, z,
            width / 2 , 0, z
        );
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    const material = new THREE.LineBasicMaterial({
        color: colour,
        transparent: true,
        opacity
    });

    const grid = new THREE.LineSegments(geometry, material);

    return grid;
}