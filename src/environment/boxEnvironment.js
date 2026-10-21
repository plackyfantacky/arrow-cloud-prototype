import * as THREE from "three";
import { createGrid } from "../primitives/geometry/createGrid";

export function createBoxEnvironment(scene, settings) {
    const geometry = new THREE.BoxGeometry(
        settings.size.x,
        settings.size.y,
        settings.size.z
    );

    const material = new THREE.MeshStandardMaterial({
        color: settings.colour,
        side: THREE.BackSide,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1
    });

    const environment = new THREE.Mesh(
        geometry,
        material
    );

    environment.receiveShadow = true;

    const position = settings.position ?? {};

    environment.position.set(
        position.x ?? 0,
        position.y ?? 0,
        position.z ?? 0
    );

    const gridSettings = settings.grid ?? null;

    if (gridSettings?.enabled) {

        const { x: width, y: height, z: depth } = settings.size;
        const angle = Math.PI / 2;

        const divisions = {
            x: Math.max(1, Math.round(width / gridSettings.spacing)),
            y: Math.max(1, Math.round(height / gridSettings.spacing)),
            z: Math.max(1, Math.round(depth / gridSettings.spacing))
        };

        const faces = [ 
            {
                position: [0, -height / 2, 0],
                rotation: [0, 0, 0],
                width: width,
                height: depth,
                columns: divisions.x,
                rows: divisions.z
            },
            {
                position: [0, height / 2, 0],
                rotation: [0, 0, 0],
                width: width,
                height: depth,
                columns: divisions.x,
                rows: divisions.z
            },
            {
                position: [0, 0, depth / 2],
                rotation: [angle, 0, 0],
                width: width,
                height: height,
                columns: divisions.x,
                rows: divisions.y
            },
            {
                position: [0, 0, -depth / 2],
                rotation: [angle, 0, 0],
                width: width,
                height: height,
                columns: divisions.x,
                rows: divisions.y
            },
            {
                position: [-width / 2, 0, 0],
                rotation: [0, 0, angle],
                width: height,
                height: depth,
                columns: divisions.y,
                rows: divisions.z
            },
            {
                position: [width / 2, 0, 0],
                rotation: [0, 0, angle],
                width: height,
                height: depth,
                columns: divisions.y,
                rows: divisions.z
            }
        ]

        faces.forEach((face) => {

            const grid = createGrid({
                width: face.width,
                height: face.height,
                columns: face.columns,
                rows: face.rows,
                colour: gridSettings.colour,
                opacity: gridSettings.opacity
            })

            grid.position.set(...face.position);
            grid.rotation.set(...face.rotation);

            environment.add(grid);
        })
    }

    scene.add(environment);

    return environment;
}