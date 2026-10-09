
const STORAGE_KEY = 'arrowCloud.editor.preferences';

const defaults = {
    cameraPanelExpanded: true,
    scenePanelExpanded: true,
    gridVisible: true,
    axesVisible: true,
    cameraTargetVisible: true,
    cameraUpVisible: true,
    pathPanelExpanded: true,
    lineLabelsVisible: true,
};

export function createEditorPreferences() {
    let savedPreferences = {};

    try {
        savedPreferences = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {};
    } catch (error) {
        console.warn('Could not load editor preferences:', error);
    }

    const preferences = {
        ...defaults,
        ...savedPreferences
    };

    function get(key) {
        return preferences[key];
    }

    function set(key, value) {
        preferences[key] = value;

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
        } catch (error) {
            console.warn('Could not save editor preferences:', error);
        }
    }

    function reset() {
        Object.assign(preferences, defaults);

        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.warn('Could not reset editor preferences:', error);
        }
    }

    return {
        get,
        set,
        reset
    };
}

export function createPanelToggle({
    button,
    content,
    label,
    initialExpanded = true,
    onExpandedChange = () => { }
}) {
    function setExpanded(isExpanded) {
        button.setAttribute('aria-expanded', String(isExpanded));
        content.hidden = !isExpanded;
        button.textContent = `${label} ${isExpanded ? '▾' : '▸'}`;
    }

    function handleClick() {
        const isExpanded = button.getAttribute('aria-expanded') === 'true';

        setExpanded(!isExpanded);
        onExpandedChange(!isExpanded);
    }

    button.addEventListener('click', handleClick);

    setExpanded(initialExpanded);

    return {
        setExpanded,

        destroy() {
            button.removeEventListener('click', handleClick);
        }
    };
}