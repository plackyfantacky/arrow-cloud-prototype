export function createDebugPathEditor(arrowPaths) {
    const state = {
        arrowPaths: arrowPaths.map(cloneArrowPath),
        selectedDebugInfo: null
    };

    function setSelectedDebugInfo(selectedDebugInfo) {
        state.selectedDebugInfo = selectedDebugInfo;
    }

    function getArrowPaths() {
        return state.arrowPaths;
    }

    function getSelectedArrowPath() {
        if (!state.selectedDebugInfo) {
            return null;
        }

        const arrowPathIndex = findArrowPathIndexByName(
            state.arrowPaths,
            state.selectedDebugInfo.arrowName
        );

        if (arrowPathIndex < 0) {
            return null;
        }

        return state.arrowPaths[arrowPathIndex];
    }

    function nudgeSelectedPathValue(amount, targetValue = 'move:0') {
        const arrowPath = getSelectedArrowPath();

        if (!arrowPath) {
            return false;
        }

        if (targetValue.startsWith('origin:')) {
            return nudgeArrowPathOrigin(arrowPath, targetValue, amount);
        }

        return nudgeArrowPathMove(
            arrowPath,
            state.selectedDebugInfo,
            targetValue,
            amount
        );
    }

    function changeSelectedMoveAction(actionName, targetOffset = 0) {
        const arrowPath = getSelectedArrowPath();

        if (!arrowPath) {
            return false;
        }

        const sourceMoveIndex = getSourceMoveIndex(
            arrowPath,
            state.selectedDebugInfo.segmentIndex
        );

        const targetMoveIndex = sourceMoveIndex + targetOffset;

        if (targetMoveIndex < 0 || targetMoveIndex >= arrowPath.moves.length) {
            return;
        }

        const move = arrowPath.moves[targetMoveIndex];
        const [, actionValue, options] = move;

        arrowPath.moves[targetMoveIndex] = options
            ? [actionName, actionValue, options]
            : [actionName, actionValue];

        if (targetOffset === 0) {
            state.selectedDebugInfo = {
                ...state.selectedDebugInfo,
                actionName
            };
        }

        return true;
    }

    function insertMoveNearSelectedMove(position, actionName = 'forward') {
        const arrowPath = getSelectedArrowPath();

        if (!arrowPath) {
            return false;
        }

        const sourceMoveIndex = getSelectedSourceMoveIndex(arrowPath);

        if (sourceMoveIndex < 0) {
            return false;
        }

        const insertOffset = position === 'before' ? 0 : 1;

        const insertIndex = sourceMoveIndex + insertOffset;

        arrowPath.moves.splice(insertIndex, 0, [actionName, 1]);

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

    function removeSelectedMove() {
        const arrowPath = getSelectedArrowPath();

        if (!arrowPath) {
            return false;
        }

        if (arrowPath.moves.length <= 1) {
            return false;
        }

        const sourceMoveIndex = getSelectedSourceMoveIndex(arrowPath);

        if (sourceMoveIndex < 0) {
            return false;
        }

        arrowPath.moves.splice(sourceMoveIndex, 1);
        state.selectedDebugInfo = null;

        return true;
    }

    function getSelectedSourceMoveIndex(arrowPath, selectedDebugInfo) {
        return getSourceMoveIndex(
            arrowPath,
            state.selectedDebugInfo.segmentIndex
        );
    }

    function getSelectedDebugInfo() {
        return state.selectedDebugInfo;
    }

    return {
        getArrowPaths,
        getSelectedArrowPath,
        getSelectedDebugInfo,
        setSelectedDebugInfo,
        nudgeSelectedPathValue,
        changeSelectedMoveAction,
        insertMoveNearSelectedMove,
        duplicateSelectedMove,
        removeSelectedMove
    };
}

function findArrowPathIndexByName(arrowPaths, arrowName) {
    return arrowPaths.findIndex((arrowPath) => {
        return arrowPath.name === arrowName;
    });
}

function nudgeArrowPathOrigin(arrowPath, targetValue, amount) {
    const axisName = targetValue.replace('origin:', '');

    const axisIndexMap = {
        x: 0,
        y: 1,
        z: 2
    };

    const axisIndex = axisIndexMap[axisName];

    if (axisIndex === undefined) {
        return;
    }

    arrowPath.origin[axisIndex] = Number(
        (arrowPath.origin[axisIndex] + amount).toFixed(3)
    );

    return true;
}

function nudgeArrowPathMove(arrowPath, selectedDebugInfo, targetValue, amount) {
    const targetOffset = Number(targetValue.replace('move:', ''));

    if (Number.isNaN(targetOffset)) {
        return;
    }

    const sourceMoveIndex = getSourceMoveIndex(
        arrowPath,
        selectedDebugInfo.segmentIndex
    );

    const targetMoveIndex = sourceMoveIndex + targetOffset;

    if (targetMoveIndex < 0 || targetMoveIndex >= arrowPath.moves.length) {
        return;
    }

    const move = arrowPath.moves[targetMoveIndex];
    const [actionName, actionValue, options] = move;

    if (typeof actionValue !== 'number') {
        return;
    }

    const nextActionValue = Math.max(
        0,
        Number((actionValue + amount).toFixed(3))
    );

    arrowPath.moves[targetMoveIndex] = options
        ? [actionName, nextActionValue, options]
        : [actionName, nextActionValue];

    return true;
}

function cloneArrowPath(arrowPath) {
    return {
        ...arrowPath,
        origin: [...arrowPath.origin],
        moves: arrowPath.moves.map((move) => {
            const [actionName, actionValue, options] = move;

            return options
                ? [actionName, actionValue, { ...options }]
                : [actionName, actionValue];
        }),
        timing: arrowPath.timing ? { ...arrowPath.timing } : undefined,
        head: arrowPath.head ? { ...arrowPath.head } : undefined,
        entry: arrowPath.entry ? { ...arrowPath.entry } : undefined,
    };
}

export function getSourceMoveIndex(arrowPath, segmentIndex) {
    const hasGeneratedEntrySegment = Boolean(
        arrowPath.entry?.side
        && ['left', 'right'].includes(arrowPath.entry.side)
        && arrowPath.entry.straightUntil !== undefined
        && arrowPath.entry.straightUntil !== null
    );

    if (hasGeneratedEntrySegment) {
        return segmentIndex - 1;
    }

    return segmentIndex;
}

function cloneMove(move) {
    const [actionName, actionValue, options] = move;

    return options
        ? [actionName, actionValue, { ...options }]
        : [actionName, actionValue];
}