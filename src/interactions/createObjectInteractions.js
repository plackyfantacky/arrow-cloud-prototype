export function createObjectInteractions(element, { getObjectAtPointer, emit }) {
    let isEnabled = true;
    let pointer = null;

    function resetPointer() {
        pointer = null;
    }

    function handlePointerDown(event) {
        if (pointer) {
            resetPointer();
            return;
        }

        if (!isEnabled || !event.isPrimary || event.button !== 0) {
            return;
        }

        const object = getObjectAtPointer(event);

        if (!object?.userData.interactions?.click?.emit) {
            return;
        }

        pointer = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            object,
            moved: false,
        };
    }

    function handlePointerMove(event) {
        if (!pointer || event.pointerId !== pointer.id) {
            return;
        }

        const distance = Math.hypot(
            event.clientX - pointer.x,
            event.clientY - pointer.y
        );

        pointer.moved ||= distance > 5;
    }

    function handlePointerUp(event) {
        if (!pointer || event.pointerId !== pointer.id) {
            return;
        }

        handlePointerMove(event);

        const gesture = pointer;
        resetPointer();

        if (!isEnabled || gesture.moved || event.button !== 0) {
            return;
        }

        if (getObjectAtPointer(event) !== gesture.object) {
            return;
        }

        const action = gesture.object.userData.interactions?.click;

        if (action?.emit) {
            emit(action.emit, {
                objectId: gesture.object.userData.sceneObjectId,
                interaction: "click",
                params: action.params ?? {},
            });
        }
    }

    function handlePointerCancel(event) {
        if (pointer?.id === event.pointerId) {
            resetPointer();
        }
    }

    element.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("pointermove", handlePointerMove, true);
    window.addEventListener("pointerup", handlePointerUp, true);
    window.addEventListener("pointercancel", handlePointerCancel, true);
    window.addEventListener("blur", resetPointer);

    return {
        setEnabled(value) {
            isEnabled = value;
            resetPointer();
        },

        destroy() {
            resetPointer();
            element.removeEventListener("pointerdown", handlePointerDown, true);
            window.removeEventListener("pointermove", handlePointerMove, true);
            window.removeEventListener("pointerup", handlePointerUp, true);
            window.removeEventListener("pointercancel", handlePointerCancel, true);
            window.removeEventListener("blur", resetPointer);
        },
    };
}