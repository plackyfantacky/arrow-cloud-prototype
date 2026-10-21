import * as THREE from 'three';

export function createAtmosphericSky(settings = {}) {
    const geometry = new THREE.SphereGeometry(50, 32, 16);

    const material = new THREE.ShaderMaterial({
        uniforms: {
            skyColour: {
                value: new THREE.Color(
                    settings.skyColour ?? '#F7B76A'
                )
            },
            horizonColour: {
                value: new THREE.Color(
                    settings.horizonColour ?? '#FFE4D3'
                )
            },
            gradientHeight: {
                value: settings.gradientHeight ?? 0.6
            }
        },

        vertexShader: `
            varying vec3 vDirection;

            void main() {
                vDirection = position;

                // Ignore camera translation, preserving rotation.
                vec4 viewPosition = viewMatrix * vec4(position, 0.0);

                gl_Position = projectionMatrix *
                    vec4(viewPosition.xyz, 1.0);
            }
        `,

        fragmentShader: `
            uniform vec3 skyColour;
            uniform vec3 horizonColour;
            uniform float gradientHeight;

            varying vec3 vDirection;

            void main() {
                float height = normalize(vDirection).y;

                float blend = smoothstep(
                    -0.15,
                    max(gradientHeight, 0.001),
                    height
                );

                vec3 colour = mix(
                    horizonColour,
                    skyColour,
                    blend
                );

                gl_FragColor = vec4(colour, 1.0);

                #include <tonemapping_fragment>
                #include <colorspace_fragment>
            }
        `,

        side: THREE.BackSide,
        depthWrite: false,
        depthTest: false,
        fog: false
    });

    const sky = new THREE.Mesh(geometry, material);

    sky.frustumCulled = false;
    sky.renderOrder = -1000;

    return sky;
}