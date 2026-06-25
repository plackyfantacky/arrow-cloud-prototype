import { createWireframePathComponent } from "./wireframe.js";
import { createPanelPathComponent } from "./panel.js";

export function createPathComponentMesh(component) {
    if (component.type === 'wireframe') {
        return createWireframePathComponent(component);
    }

    if (component.type === 'panel') {
        return createPanelPathComponent(component);
    }

    throw new Error(
        `Unknown path component type "${component.type}"`
    );
}
