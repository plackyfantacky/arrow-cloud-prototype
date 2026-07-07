export const animationSettings = {
    timelineDuration: 10,
    speed: 1,
    isPlaying: true,
    isLooping: false,
    debugMode: false
}

export const cameraTrack = [
    // {
    //     time: 0,
    //     position: { x: 0, y: 5, z: 12 },
    //     target: { x: 0, y: 0, z: 0 }
    // },
    // {
    //     time: 4,
    //     position: { x: -2, y: 4, z: 9 },
    //     target: { x: 0, y: 0.5, z: 0 }
    // },
    {
        time: 0,
        position: { x: 2.5, y: 3.5, z: 8 },
        target: { x: 0.5, y: 0.5, z: 0 }
    },
    {
        time: 8,
        position: { x: 1, y: 4, z: 10 },
        target: { x: 0, y: 0, z: 0 }
    }
];

export const arrowPaths = [
    {
        name: 'left-1',
        origin: [-6, 0, 0],
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
            ['bendDown', 1],
            ['turnLeft', 8],
        ],
        timing: {
            delay: 0,
            duration: 8,
        },
        entry: {
            side: 'left',
            margin: 1.5,
            straightUntil: -4.5
        },
    },
    {
        name: 'left-2',
        origin: [-6, 0, -1.2],
        initialDirection: '+x',
        initialNormal: '+y',
        moves: [
            ['forward', 1.5],
            ['turnLeft', 1],
            ['turnRight', 2],
            ['bendUp', 1],
            ['bendDown', 1],
            ['turnLeft', 1],
            ['bendUp', 1]
        ],
        timing: {
            delay: 0,
            duration: 6.5,
        },
        entry: {
            side: 'left',
            margin: 1.5,
            straightUntil: -4.5
        },
        // head: {
        //     hideAt: 6.5,
        //     hideDuration: 0.5,
        // }
    },
    {
        name: 'right-1',
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
            duration: 8,
        },
        entry: {
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
                    height: 1.2,
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