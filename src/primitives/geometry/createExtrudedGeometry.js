import * as THREE from "three";

export function createExtrudedGeometry(settings) {
    if (!Array.isArray(settings.shapes) || settings.shapes.length === 0) {
        throw new Error("Extruded geometry requires at least one shape.");
    }

    const shapes = settings.shapes.map((definition) => {
        const shape = new THREE.Shape();

        if (definition.commands) {
            applyPathCommand(shape, definition.commands);
        } else {
            shape.setFromPoints(
                createOutlinePoints(definition.outline)
            );
        }

        shape.autoClose = true;

        shape.holes = (definition.holes ?? []).map((outline) => {
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
        curveSegments: settings.curveSegments ?? 12,
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
    });
}

function applyPathCommand(path, commands) {
    const commandDefinitions = {
        M: { method: "moveTo", arguments: 2 },
        L: { method: "lineTo", arguments: 2 },
        C: { method: "bezierCurveTo", arguments: 6 },
        Z: { method: "closePath", arguments: 0 },
    };

    commands.forEach(([command, ...values]) => {
        const definition = commandDefinitions[command];

        if (!definition || values.length !== definition.arguments || !values.every(Number.isFinite)) {
            throw new Error(`Invalid outline command: ${command}`);
        }

        path[definition.method](...values);
    });
}
