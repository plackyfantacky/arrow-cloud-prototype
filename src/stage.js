export function getStageSize(mountElement) {
    return {
        width: mountElement.clientWidth || window.innerWidth,
        height: mountElement.clientHeight || window.innerHeight
    }
}