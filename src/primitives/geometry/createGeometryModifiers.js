import * as THREE from "three";

export function createGeometryModifiers(geometry, definitions = []) {
    const states = Object.create(null);
    const axes = { x: 0, y: 1, z: 2 };

    const modifiers = definitions.map((definition) => {
        const { id, type, axis, by } = definition;

        if (typeof id !== "string" || id.trim() === "" || Object.hasOwn(states, id)) {
            throw new Error("Geometry modifiers require unique, non-empty ids.");
        }

        if (type !== "shear" || !Object.hasOwn(axes, axis) || !Object.hasOwn(axes, by) || axis === by) {
            throw new Error(`Invalid shear modifier: ${id}`);
        }

        const state = {
            amount: definition.amount ?? 0,
            enabled: definition.enabled ?? true,
        };

        states[id] = state;

        return {
            state,
            destinationAxis: axes[axis],
            sourceAxis: axes[by],
        };
    });

    if (modifiers.length === 0) {
        return {
            states,
            update() {},
        };
    }

    const positions = geometry.getAttribute("position");
    const normals = geometry.getAttribute("normal");

    const originalPositions = positions.array.slice();
    const originalNormals = normals?.array.slice();

    const combinedMatrix = new THREE.Matrix4();
    const shearMatrix = new THREE.Matrix4();

    let previousAmounts = [];

    function update() {
        const amounts = modifiers.map(({ state }) => {
            if (!Number.isFinite(state.amount)) {
                throw new Error("Shear amounts must be finite numbers.");
            }

            return state.enabled ? state.amount : 0;
        });

        const hasChanged = amounts.some((amount, index) => {
            return amount !== previousAmounts[index];
        });

        if (!hasChanged) {
            return;
        }

        combinedMatrix.identity();

        modifiers.forEach((modifier, index) => {
            shearMatrix.identity();

            const matrixIndex = modifier.sourceAxis * 4 + modifier.destinationAxis;

            shearMatrix.elements[matrixIndex] = amounts[index];

            combinedMatrix.premultiply(shearMatrix);
        });

        positions.array.set(originalPositions);

        if (normals) {
            normals.array.set(originalNormals);
        }

        geometry.applyMatrix4(combinedMatrix);
        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();

        previousAmounts = amounts;
    }

    update();

    return {
        states,
        update,
    };
}
