// export const animationSettings = {
//     timelineDuration: 8,
//     speed: 1,
//     isPlaying: true,
//     isLooping: false,
//     debugMode: true
// }

// export const cameraTrack = [
//     {
//         time: 0,
//         position: { x: 0, y: 5, z: 12 },
//         target: { x: 0, y: 0, z: 0 }
//     },
//     {
//         time: 3,
//         position: { x: -2, y: 4, z: 9 },
//         target: { x: 0, y: 0.5, z: 0 }
//     },
//     {
//         time: 6,
//         position: { x: 2.5, y: 3.5, z: 8 },
//         target: { x: 0.5, y: 0.5, z: 0 }
//     },
//     {
//         time: 8,
//         position: { x: 1, y: 4, z: 10 },
//         target: { x: 0, y: 0, z: 0 }
//     }
// ];

// export const arrowPaths = [
//     {
//         name: 'demo',
//         origin: [-2, 0, 0],
//         initialDirection: '+x',
//         initialNormal: '+y',
//         moves: [
//             ['forward', 3],
//             ['bendUp', 2],
//             ['bendUp', 2],
//             ['turnRight', 2],
//             ['turnRight', 2],
//             ['bendUp', 1.75],
//             ['bendUp', 2],
//             ['turnRight', 3],
//         ],
//         timing: {
//             delay: 0,
//             duration: 8,
//         }
//     },
// ];

export const animationSettings = {
    timelineDuration: 6,
    speed: 1,
    isPlaying: true,
    isLooping: false,
    debugMode: true
}

export const cameraTrack = [
    {
        time: 0,
        position: { x: 2.5, y: 3.5, z: 8 },
        target: { x: 0.5, y: 0.5, z: 0 }
    },
    {
        time: 8,
        position: { x: 1, y: 4, z: 10 },
        target: { x: 0, y: 2, z: 0 }
    }
];

export const arrowPaths = [
    {
        name: 'left-1',
        origin: [-8, 0, 0],
        initialDirection: '+x',
        initialNormal: '+y',
        moves: [
            ['forward', 2],
            ['bendUp', 2],
            ['bendDown', 2],
            ['turnRight', 1],
            ['bendDown', 1],
            ['turnLeft', 2],
            ['bendUp', 1],
            ['turnLeft', 1],
            ['bendDown', 0.8],
            ['turnLeft', 8],
        ],
        timing: {
            delay: 0,
            duration: 6,
        },
        entry: {
            position: 'viewport',
            side: 'left',
            margin: 3,
            straightUntil: -4.5
        },
    },
    {
        name: 'left-2',
        origin: [-8, 0, 0.5],
        initialDirection: '+x',
        initialNormal: '+y',
        moves: [
            ['forward', 1.5],
            ['bendUp', 1],
            ['bendDown', 1.5],
            ['turnLeft', 1],
            ['turnRight', 2],
            ['bendUp', 1],
            ['bendDown', 1],
            ['turnLeft', 1],
            ['bendUp', 1]
        ],
        timing: {
            delay: 0,
            duration: 6,
        },
        entry: {
            position: 'viewport',
            side: 'left',
            margin: 3,
            straightUntil: -6.5
        },
    },   
    {
        name: 'left-3',
        origin: [-8, 0, 1],
        initialDirection: '+x',
        initialNormal: '+y',
        moves: [
            ['turnRight', 1.25],
            ['forward', 1.5],
            ['bendDown', 2],
            ['turnLeft', 3],
            ['turnLeft', 1],
            ['bendUp', 1.25],
            ['forward', 2],
        ],
        timing: {
            delay: 0.1,
            duration: 6,
        },
        entry: {
            position: 'viewport',
            side: 'left',
            margin: 3,
            straightUntil: -6.2
        },
    },
    // Right side 
    {
        name: 'right-1',
        origin: [6, 2.4, -2.2],
        initialDirection: '-x',
        initialNormal: '+y',
        moves: [
            ['turnLeft', 1.25],
            ['forward', 1.5],
            ['bendUp', 1.5],
            ['turnRight', 2],
            ['bendUp', 1],
            ['forward', 2],
        ],
        timing: {
            delay: 0.15,
            duration: 6,
        },
        entry: {
            position: 'viewport',
            side: 'right',
            margin: 2,
            straightUntil: 2.7
        },
    },
    {
        name: 'right-2',
        origin: [6, -1, 1],
        initialDirection: '-x',
        initialNormal: '+y',
        moves: [
            ['bendDown', 1],
            ['turnRight', 1.5],
            ['forward', 1.75],
            ['bendUp', 1.25],
            ['turnLeft', 2],
            ['forward', 1.5],
        ],
        timing: {
            delay: 0.3,
            duration: 6,
        },
        entry: {
            position: 'viewport',
            side: 'right',
            margin: 1.7,
            straightUntil: 4.5
        },
    },
    {
        name: 'right-3',
        origin: [6, 0.2, -0.2],
        initialDirection: '-x',
        initialNormal: '+y',
        moves: [
            ['forward', 1.25],
            ['turnRight', 1],
            ['bendUp', 1.5],
            ['turnLeft', 1.75],
            ['bendDown', 1.25],
            ['forward', 2],
        ],
        timing: {
            delay: 0.45,
            duration: 6,
        },
        entry: {
            position: 'viewport',
            side: 'right',
            margin: 1.25,
            straightUntil: 4.25
        },
    },
    {
        name: 'final',
        origin: [6, 0, 1.2],
        initialDirection: '-x',
        initialNormal: '+y',
        moves: [
            ['forward', 1],
            ['turnRight', 1],
            ['bendUp', 3],
            ['turnLeft', 2],
            ['turnLeft', 3],
            ['bendDown', 1],
            ['turnRight', 2],
            ['bendDown', 1],
            ['bendDown', 4],
            ['bendUp', 2],            
            ['bendUp', 6],
        ],
        timing: {
            delay: 0,
            duration: 6,
        },
        entry: {
            position: 'viewport',
            side: 'right',
            margin: 1.5,
            straightUntil: 4.5
        },
        components: [
            {
                type: 'panel',
                name: 'test-screen-2',
                placement: {
                    segmentIndex: 3,
                    align: 'centre',
                    anchor: 'centre',
                },
                size: {
                    width: 1.5,
                    height: 1.5,
                    depth: 0.12
                },
                timing: {
                    delay: 2.1,
                    duration: 0.5
                },
                frameThickness: 0.12,
                face: {
                    color: 0xFF9D2A,
                    image: {
                        src: '/assets/logo-white-outline.svg',
                        fit: 'contain',
                        rotationDegrees: -90,
                        padding: 0.12,
                        aspectRatio: 1,
                        scale: 1,
                        offset: {
                            x: 0,
                            y: 0
                        }
                    }
                }
            }
        ]
    },
];

//unused but here for reference

// {
//     name: 'right-2',
//     origin: [6, 3, 9],
//     initialDirection: '-x',
//     initialNormal: '+y',
//     moves: [
//         ['forward', 3.5],
//         ['twist', 3, 360],
//         ['forward', 0.2],
//         ['turnRight', 1],
//         ['turnLeft', 1],
//         ['curveTo', { x: 4, y: 1.5, z: 0 }, {
//             endAngle: 35,
//             angleAxis: 'side',
//             endRoll: 45,
//             handleScale: 0.35
//         }]
//     ],
//     timing: {
//         delay: 0,
//         duration: 6,
//     },
// },