export function createArrowDisplayState(arrowPaths = []) {
    const visibilityState = new Map();
    const opacityState = new Map();

    function reset(nextArrowPaths) {
        visibilityState.clear();
        opacityState.clear();

        nextArrowPaths.forEach((arrowPath) => {
            visibilityState.set(arrowPath.name, true);
            opacityState.set(arrowPath.name, 1);
        });
    }

    function setVisibility(arrowName, isVisible) {
        visibilityState.set(arrowName, isVisible);
    }

    function setOpacity(arrowName, opacity) {
        opacityState.set(arrowName, opacity);
    }

    function setObjectOpacity(object, opacity) { 
        object.traverse((childObject) => {
            if (!childObject.isMesh || !childObject.material) {
                return;
            }

            const materials = Array.isArray(childObject.material)
                ? childObject.material
                : [childObject.material];

            materials.forEach((material) => {
                material.transparent = opacity < 1;
                material.opacity = opacity;
                material.needsUpdate = true;
            });
        });
    }

    function apply(renderedArrowItems) {
        renderedArrowItems.forEach((renderedArrowItem) => {
            const arrowName = renderedArrowItem.arrow.userData.name;
            const isVisible = visibilityState.get(arrowName) ?? true;
            const opacity = opacityState.get(arrowName) ?? 1;

            renderedArrowItem.arrow.visible = isVisible;

            renderedArrowItem.componentMeshes.forEach((componentMesh) => {
                componentMesh.visible = isVisible;
                setObjectOpacity(componentMesh, opacity);
            });

            if (renderedArrowItem.label) {
                renderedArrowItem.label.visible = isVisible;
            }

            setObjectOpacity(renderedArrowItem.arrow, opacity);
        });
    }

    reset(arrowPaths);

    return {
        reset,
        setVisibility,
        setOpacity,
        apply
    };

}

