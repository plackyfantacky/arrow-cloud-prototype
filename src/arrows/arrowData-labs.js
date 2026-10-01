export const animationSettings = {
    timelineDuration: 5,
    speed: 1,
    isPlaying: true,
    isLooping: false,
    // showFinalState: true,
    debugMode: true
};

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
        origin: [-8, 1.25, 0],
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
            duration: 4,
        },
        entry: {
            position: 'viewport',
            side: 'left',
            margin: 3,
            straightUntil: -2
        },
        head: {
            morphAt: 4,
            morphDuration: 0.75,
        }
    },
    {
        name: "left-2",
        origin: [
            -8,
            0.85,
            0.5
        ],
        initialDirection: "+x",
        initialNormal: "+y",
        moves: [
            ["forward", 1],
            ["bendUp", 2],
            ["bendDown", 1.5],
            ["turnLeft", 1],
            ["turnRight", 2],
            ["bendUp", 1],
            ["bendDown", 1],
            ["turnLeft", 1],
            ["bendUp", 1]
        ],
        timing: {
            delay: 0,
            duration: 4
        },
        entry: {
            position: "viewport",
            side: "left",
            margin: 3,
            straightUntil: -2
        },
        head: {
            morphAt: 4,
            morphDuration: 0.75,
        }
    },
    {
        name: "left-3",
        origin: [
            -8,
            0,
            1
        ],
        initialDirection: "+x",
        initialNormal: "+y",
        moves: [
            ["bendUp", 2],
            ["turnLeft", 1.5],
            ["bendDown", 4.5],
            ["bendDown", 2.25],
            ["turnLeft", 1],
            ["bendDown", 1.25],
            ["bendDown", 2.5],
            ["bendUp", 2.25]
        ],
        timing: {
            delay: 0.1,
            duration: 4
        },
        entry: {
            position: "viewport",
            side: "left",
            margin: 3,
            straightUntil: -2
        },
        head: {
            morphAt: 4,
            morphDuration: 0.75,
        }
    },
    // Right side 
    {
        name: 'right-1',
        origin: [8, 1.75, 0],
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
            delay: 0,
            duration: 4,
        },
        entry: {
            position: 'viewport',
            side: 'right',
            margin: 3,
            straightUntil: 2
        },
        head: {
            morphAt: 4,
            morphDuration: 0.75,
        }
    },
    {
        name: "right-2",
        origin: [
            8,
            1,
            0.5
        ],
        initialDirection: "-x",
        initialNormal: "+y",
        moves: [
            ["bendDown", 1],
            ["turnRight", 1.5],
            ["forward", 1.75],
            ["bendUp", 1.25],
            ["turnLeft", 2],
            ["forward", 1.5]
        ],
        timing: {
            delay: 0,
            duration: 4
        },
        entry: {
            position: "viewport",
            side: "right",
            margin: 3,
            straightUntil: 5.75
        },
        head: {
            morphAt: 4,
            morphDuration: 0.75,
        }
    },
    {
        name: 'right-3',
        origin: [8, 2.5, 1],
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
            delay: 0,
            duration: 4,
        },
        entry: {
            position: 'viewport',
            side: 'right',
            margin: 3,
            straightUntil: 2
        },
        head: {
            morphAt: 4,
            morphDuration: 0.75,
        }
    },
    // {
    //     name: 'final',
    //     origin: [6, 0, 1.2],
    //     initialDirection: '-x',
    //     initialNormal: '+y',
    //     moves: [
    //         ['forward', 1],
    //         ['turnRight', 1],
    //         ['bendUp', 3],
    //         ['turnLeft', 2],
    //         ['turnLeft', 3],
    //         ['bendDown', 1],
    //         ['turnRight', 2],
    //         ['bendDown', 1],
    //         ['bendDown', 4],
    //         ['bendUp', 2],            
    //         ['bendUp', 6],
    //     ],
    //     timing: {
    //         delay: 0,
    //         duration: 6,
    //     },
    //     entry: {
    //         side: 'right',
    //         margin: 1.5,
    //         straightUntil: 2
    //     },
    //     components: [
    //         {
    //             type: 'panel',
    //             name: 'test-screen-2',
    //             placement: {
    //                 segmentIndex: 3,
    //                 align: 'centre',
    //                 anchor: 'centre',
    //             },
    //             size: {
    //                 width: 1.5,
    //                 height: 1.5,
    //                 depth: 0.12
    //             },
    //             timing: {
    //                 delay: 2.1,
    //                 duration: 0.5
    //             },
    //             frameThickness: 0.12,
    //             face: {
    //                 color: 0xFF9D2A,
    //                 image: {
    //                     src: '/assets/logo-white-outline.svg',
    //                     fit: 'contain',
    //                     rotationDegrees: -90,
    //                     padding: 0.12,
    //                     aspectRatio: 1,
    //                     scale: 1,
    //                     offset: {
    //                         x: 0,
    //                         y: 0
    //                     }
    //                 }
    //             }
    //         }
    //     ]
    // },
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