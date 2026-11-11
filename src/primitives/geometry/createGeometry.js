import * as THREE from "three";

import { createExtrudedGeometry } from "./createExtrudedGeometry.js";

export function createGeometry(settings = {}) {
    switch (settings.type) {
        case "box":
            return new THREE.BoxGeometry(
                settings.width ?? 1,
                settings.height ?? 1,
                settings.depth ?? 1
            );

        case "extrude":
            return createExtrudedGeometry(settings);

        default:
            throw new Error(
                `Unsupported geometry type: ${settings.type}`
            );
    }
}