export function applyObjectProjection(mesh, settings = {}) {
    const projection = {
        perspective: settings.perspective ?? 1,
    };

    if (!Number.isFinite(projection.perspective) || projection.perspective < 0 || projection.perspective > 1) {
        throw new Error("Object perspective must be between zero and one.");
    }

    const perspectiveUniform = {
        value: projection.perspective,
    }

    const material = mesh.material;
    mesh.userData.projection = projection;

    // Temporary: ordinary bounds do not describe the modified projection.
    mesh.frustumCulled = false;

    material.onBeforeCompile = (shader) => {
        shader.uniforms.uObjectPerspective = perspectiveUniform;

        shader.vertexShader = `
            uniform float uObjectPerspective;
            ${shader.vertexShader}
        `;

        shader.vertexShader = shader.vertexShader.replace(
            "#include <project_vertex>",
            `
                #include <project_vertex>

                vec4 objectCentreView = modelViewMatrix *
                    vec4(0.0, 0.0, 0.0, 1.0);

                if (
                    uObjectPerspective < 1.0 &&
                    objectCentreView.z < -0.0001
                ) {
                    vec4 objectPlaneClip = projectionMatrix * vec4(
                        mvPosition.xy,
                        objectCentreView.z,
                        1.0
                    );

                    vec2 orthographicClipXY =
                        objectPlaneClip.xy *
                        (gl_Position.w / objectPlaneClip.w);

                    gl_Position.xy = mix(
                        orthographicClipXY,
                        gl_Position.xy,
                        uObjectPerspective
                    );
                }
            `
        );
    };

    material.onBeforeRender = () => {
        perspectiveUniform.value = projection.perspective;
    };

    material.customProgramCacheKey = () => "object-projection-v1";

    material.needsUpdate = true;
}