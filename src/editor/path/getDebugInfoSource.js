export function getDebugInfoSource(object) {
    let currentObject = object;

    while (currentObject) {
        if (currentObject.userData?.debugInfo) {
            return currentObject;
        }

        currentObject = currentObject.parent;
    }

    return null;
}