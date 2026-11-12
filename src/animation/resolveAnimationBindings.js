export function resolveAnimationBindings(definitions = {}, objectId) {
    return Object.entries(definitions).map(([name, definition]) => {
        const binding = typeof definition === "string" ? { play: definition } : definition;

        const definesAt = binding.at !== undefined;
        const definesOn = binding.on !== undefined;

        const hasAt = definesAt && !definesOn;
        const hasOn = definesOn && !definesAt;

        const identifier = `${objectId}.${name}`;

        if (definesAt && definesOn) {
            console.warn(`Animation "${object.userData.sceneObjectId}.${bindingName}" ` + 'defines both "at" and "on". Automatic activation disabled.');
        }

        if (hasAt && (!Number.isFinite(binding.at) || binding.at < 0)) {
            throw new Error(`Animation "${identifier}" requires a non-negative "at".`);
        }

        if (hasOn && (typeof binding.on !== "string" || binding.on.trim() === "")) {
            throw new Error(`Animation "${identifier}" requires a non-empty "on".`);
        }

        return {
            name,
            binding,
            hasAt,
            hasOn,
        };
    });
}