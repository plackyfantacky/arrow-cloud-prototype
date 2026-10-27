import { createArrowPathSegments } from "../../arrows/createArrowPaths.js";

export function createPathEditor(arrowPaths) {
    const state = {
        arrowPaths: arrowPaths.map(cloneArrowPath),
        selectedPathInfo: null,
    };

    function addPath(origin = [0, 0, 0]) {
        const pathName = generatePathName(state.arrowPaths);

        const newPath = {
            name: pathName,
            origin: [...origin],
            initialDirection: "+x",
            initialNormal: "+y",
            moves: [["forward", 1]],
        };

        state.arrowPaths.push(newPath);

        return newPath;
    }

    function removePath(pathName) {
        const pathIndex = state.arrowPaths.findIndex((path) => {
            return path.name === pathName;
        });

        if (pathIndex === -1) {
            return false;
        }

        state.arrowPaths.splice(pathIndex, 1);

        if (state.selectedPathInfo?.arrowName === pathName) {
            state.selectedPathInfo = null;
        }

        return true;
    }

    function setSelectedPathInfo(selectedPathInfo) {
        state.selectedPathInfo = selectedPathInfo;
    }

    function setArrowPaths(arrowPaths) {
        state.arrowPaths = arrowPaths.map(cloneArrowPath);

        state.selectedPathInfo = null;
    }

    function getArrowPaths() {
        return state.arrowPaths;
    }

    function getSelectedArrowPath() {
        if (!state.selectedPathInfo) {
            return null;
        }

        const arrowPathIndex = findArrowPathIndexByName(state.arrowPaths, state.selectedPathInfo.arrowName);

        if (arrowPathIndex < 0) {
            return null;
        }

        return state.arrowPaths[arrowPathIndex];
    }

    function nudgeSelectedPathValue(amount, targetValue = "move:0") {
        const arrowPath = getSelectedArrowPath();

        if (!arrowPath) {
            return false;
        }

        if (targetValue.startsWith("origin:")) {
            return nudgeArrowPathOrigin(arrowPath, targetValue, amount);
        }

        if (targetValue === "entry:straightUntil") {
            return nudgeArrowPathStraightUntil(arrowPath, amount);
        }

        return nudgeArrowPathMove(arrowPath, state.selectedPathInfo, targetValue, amount);
    }

    function changeSelectedMoveAction(actionName, targetOffset = 0) {
        const arrowPath = getSelectedArrowPath();

        if (!arrowPath) {
            return false;
        }

        const sourceMoveIndex = getSourceMoveIndex(arrowPath, state.selectedPathInfo.segmentIndex);

        const targetMoveIndex = sourceMoveIndex + targetOffset;

        if (targetMoveIndex < 0 || targetMoveIndex >= arrowPath.moves.length) {
            return;
        }

        const move = arrowPath.moves[targetMoveIndex];
        const [, actionValue, options] = move;

        arrowPath.moves[targetMoveIndex] = options ? [actionName, actionValue, options] : [actionName, actionValue];

        if (targetOffset === 0) {
            state.selectedPathInfo = {
                ...state.selectedPathInfo,
                actionName,
            };
        }

        return true;
    }

    function insertMoveNearSelectedMove(position, actionName = "forward") {
        const arrowPath = getSelectedArrowPath();

        if (!arrowPath) {
            return false;
        }

        const sourceMoveIndex = getSelectedSourceMoveIndex(arrowPath);

        if (sourceMoveIndex < 0) {
            return false;
        }

        const insertOffset = position === "before" ? 0 : 1;
        const insertIndex = sourceMoveIndex + insertOffset;

        arrowPath.moves.splice(insertIndex, 0, [actionName, 1]);

        state.selectedPathInfo = {
            ...state.selectedPathInfo,
            segmentIndex: position === "after" ? state.selectedPathInfo.segmentIndex + 1 : state.selectedPathInfo.segmentIndex,
            actionName,
        };

        return true;
    }

    function duplicateSelectedMove() {
        const arrowPath = getSelectedArrowPath();

        if (!arrowPath) {
            return false;
        }

        const sourceMoveIndex = getSelectedSourceMoveIndex(arrowPath);

        if (sourceMoveIndex < 0) {
            return false;
        }

        const move = arrowPath.moves[sourceMoveIndex];

        arrowPath.moves.splice(sourceMoveIndex + 1, 0, cloneMove(move));

        return true;
    }

    function setPathOrigin(arrowName, position) {
        const arrowPath = state.arrowPaths.find((path) => {
            return path.name === arrowName;
        });

        if (!arrowPath || arrowPath.entry?.position === "viewport") {
            return false;
        }

        const nextOrigin = position.toArray();

        if (
            arrowPath.origin.every((value, index) => {
                return value === nextOrigin[index];
            })
        ) {
            return false;
        }

        arrowPath.origin = nextOrigin;

        return true;
    }

    function canRemoveSelectedMove() {
        const arrowPath = getSelectedArrowPath();

        if (!arrowPath) {
            return false;
        }

        return arrowPath.moves.length > 1;
    }

    function removeMoves(mode = "single") {
        const arrowPath = getSelectedArrowPath();

        if (!arrowPath) {
            return false;
        }

        const selectedIndex = getSelectedSourceMoveIndex(arrowPath);
        const moveCount = arrowPath.moves.length;

        if (selectedIndex < 0 || selectedIndex >= moveCount) {
            return false;
        }

        // Prevent trimming when only the selected segment would be removed.
        if ((mode === "start" && selectedIndex === 0) || (mode === "end" && selectedIndex === moveCount - 1)) {
            return false;
        }

        let startIndex;
        let deleteCount;
        let nextPathStart = null;

        switch (mode) {
            case "start":
                startIndex = 0;
                deleteCount = selectedIndex + 1;
                break;

            case "end":
                startIndex = selectedIndex;
                deleteCount = moveCount - selectedIndex;
                break;

            default:
                startIndex = selectedIndex;
                deleteCount = 1;
        }

        // A path must retain at least one move.
        if (moveCount - deleteCount < 1) {
            return false;
        }

        if (mode === "start") {
            // "Viewport" entries need separate handling because they can override the origin and generate moves.
            if (arrowPath.entry?.position === "viewport") {
                return false;
            }

            if (arrowPath.entry?.straightUntil != null && ["left", "right"].includes(arrowPath.entry?.side)) {
                return false;
            }

            nextPathStart = getTrimmedPathStart(arrowPath, selectedIndex);

            if (!nextPathStart) {
                return false;
            }
        }

        arrowPath.moves.splice(startIndex, deleteCount);

        if (nextPathStart) {
            arrowPath.origin = nextPathStart.origin;
            arrowPath.initialDirection = nextPathStart.initialDirection;
            arrowPath.initialNormal = nextPathStart.initialNormal;
        }

        state.selectedPathInfo = null;

        return true;
    }

    function getSelectedSourceMoveIndex(arrowPath, selectedPathInfo) {
        return getSourceMoveIndex(arrowPath, state.selectedPathInfo.segmentIndex);
    }

    function getSelectedPathInfo() {
        return state.selectedPathInfo;
    }

    function isSelectedMoveLast() {
        const arrowPath = getSelectedArrowPath();

        if (!arrowPath) {
            return false;
        }

        const sourceMoveIndex = getSelectedSourceMoveIndex(arrowPath);

        return sourceMoveIndex === arrowPath.moves.length - 1;
    }

    function isSelectedMoveFirst() {
        const arrowPath = getSelectedArrowPath();

        if (!arrowPath) {
            return false;
        }

        return getSelectedSourceMoveIndex(arrowPath) === 0;
    }

    return {
        addPath,
        removePath,
        getArrowPaths,
        getSelectedArrowPath,
        getSelectedPathInfo,
        setSelectedPathInfo,
        setArrowPaths,
        nudgeSelectedPathValue,
        changeSelectedMoveAction,
        insertMoveNearSelectedMove,
        duplicateSelectedMove,
        setPathOrigin,
        canRemoveSelectedMove,
        removeMoves,
        isSelectedMoveLast,
        isSelectedMoveFirst,
    };
}

function generatePathName(paths) {
    let index = 1;

    while (paths.some((path) => path.name === `path-${index}`)) {
        index++;
    }

    return `path-${index}`;
}

function findArrowPathIndexByName(arrowPaths, arrowName) {
    return arrowPaths.findIndex((arrowPath) => {
        return arrowPath.name === arrowName;
    });
}

function nudgeArrowPathOrigin(arrowPath, targetValue, amount) {
    const axisName = targetValue.replace("origin:", "");

    const axisIndexMap = {
        x: 0,
        y: 1,
        z: 2,
    };

    const axisIndex = axisIndexMap[axisName];

    if (axisIndex === undefined) {
        return;
    }

    arrowPath.origin[axisIndex] = Number((arrowPath.origin[axisIndex] + amount).toFixed(3));

    return true;
}

function nudgeArrowPathMove(arrowPath, selectedPathInfo, targetValue, amount) {
    const targetOffset = Number(targetValue.replace("move:", ""));

    if (Number.isNaN(targetOffset)) {
        return;
    }

    const sourceMoveIndex = getSourceMoveIndex(arrowPath, selectedPathInfo.segmentIndex);

    const targetMoveIndex = sourceMoveIndex + targetOffset;

    if (targetMoveIndex < 0 || targetMoveIndex >= arrowPath.moves.length) {
        return;
    }

    const move = arrowPath.moves[targetMoveIndex];
    const [actionName, actionValue, options] = move;

    if (typeof actionValue !== "number") {
        return;
    }

    const nextActionValue = Math.max(0, Number((actionValue + amount).toFixed(3)));

    arrowPath.moves[targetMoveIndex] = options ? [actionName, nextActionValue, options] : [actionName, nextActionValue];

    return true;
}

function nudgeArrowPathStraightUntil(arrowPath, amount) {
    if (arrowPath.entry?.straightUntil === undefined || arrowPath.entry.straightUntil === null) {
        return false;
    }

    arrowPath.entry.straightUntil = Number((arrowPath.entry.straightUntil + amount).toFixed(3));

    return true;
}

function cloneArrowPath(arrowPath) {
    return {
        ...arrowPath,
        origin: [...arrowPath.origin],
        moves: arrowPath.moves.map((move) => {
            const [actionName, actionValue, options] = move;

            return options ? [actionName, actionValue, { ...options }] : [actionName, actionValue];
        }),
        timing: arrowPath.timing ? { ...arrowPath.timing } : undefined,
        head: arrowPath.head ? { ...arrowPath.head } : undefined,
        entry: arrowPath.entry ? { ...arrowPath.entry } : undefined,
        initialDirection: Array.isArray(arrowPath.initialDirection) ? [...arrowPath.initialDirection] : arrowPath.initialDirection,
        initialNormal: Array.isArray(arrowPath.initialNormal) ? [...arrowPath.initialNormal] : arrowPath.initialNormal,
    };
}

export function getSourceMoveIndex(arrowPath, segmentIndex) {
    const hasGeneratedEntrySegment = Boolean(arrowPath.entry?.side && ["left", "right"].includes(arrowPath.entry.side) && arrowPath.entry.straightUntil !== undefined && arrowPath.entry.straightUntil !== null);

    if (hasGeneratedEntrySegment) {
        return segmentIndex - 1;
    }

    return segmentIndex;
}

function cloneMove(move) {
    const [actionName, actionValue, options] = move;

    return options ? [actionName, actionValue, { ...options }] : [actionName, actionValue];
}

function getTrimmedPathStart(arrowPath, segmentIndex) {
    const segments = createArrowPathSegments(arrowPath);
    const segment = segments[segmentIndex];

    if (!segment) {
        return null;
    }

    return {
        origin: segment.endPoint.toArray(),
        initialDirection: segment.frame.forward.toArray(),
        initialNormal: segment.frame.normal.toArray(),
    };
}
