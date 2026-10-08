export function getPathInfoSource(object) {
    let currentObject = object;

    while (currentObject) {
        if (currentObject.userData?.pathInfo) {
            return currentObject;
        }

        currentObject = currentObject.parent;
    }

    return null;
}