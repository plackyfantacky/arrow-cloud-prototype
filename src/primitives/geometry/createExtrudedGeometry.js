import * as THREE from "three";

export function createExtrudedGeometry(settings) {
    if (!Array.isArray(settings.shapes) || settings.shapes.length === 0) {
        throw new Error("Extruded geometry requires at least one shape.");
    }

    const shapes = settings.shapes.map((definition) => {
        const shape = new THREE.Shape(definition.outline);

        shape.autoClose = true;

        shape.hole = (definition.holes ?? []).map((outline) => {
            const hole = new THREE.Path(createOutlinePoints(outline));
            hole.autoClose = true;
            return hole;
        });

        return shape;
    });

    const depth = settings.depth ?? 0.25;

    const geometry = new THREE.ExtrudeGeometry(shapes, {
        depth,
        steps: 1,
        bevelEnabled: false,
    });

    geometry.translate(0, 0, -depth / 2);

    return geometry;
}

function createOutlinePoints(points) {
    if (!Array.isArray(points) || points.length < 3) {
        throw new Error("An outline requires at least three points.");
    }

    return points.map((point) => {
        if (!Array.isArray(point) || point.length !== 2 || !point.every(Number.isFinite)) {
            throw new Error("Outline points must contain two finite numbers.");
        }
        return new THREE.Vector2(point[0], point[1]);
    })
}