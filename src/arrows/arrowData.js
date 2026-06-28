export const animationSettings = {
    timelineDuration: 4,
    speed: 1,
    isPlaying: true,
    isLooping: false,
    debugMode: false
}

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
            duration: 2,
        }
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
            duration: 2.5,
        },
        head: {
            hideAt: 2.5,
            hideDuration: 0.5,
        },
        components: [
            {
                type: 'panel',
                name: 'test-screen-1',
                placement: {
                    segmentIndex: 6,
                    align: 'end',
                    anchor: 'start'
                },
                size: {
                    width: 2,
                    height: 1.2,
                    depth: 0.08
                },
                timing: {
                    delay: 2.5,
                    duration: 0.5
                }
            }
        ]
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
            duration: 4,
        },
        components: [
            {
                type: 'panel',
                name: 'test-screen-2',
                placement: {
                    segmentIndex: 2,
                    align: 'centre',
                    anchor: 'centre',
                },
                size: {
                    width: 1.5,
                    height: 1.2,
                    depth: 0.12
                },
                timing: {
                    delay: 0.5,
                    duration: 0.5
                },
                frameThickness: 0.12,
                face: {
                    color: 0xffffff,
                    image: {
                        src: '/images/request-service_hires.png',
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
            },
            {
                type: 'panel',
                name: 'test-screen-3',
                placement: {
                    segmentIndex: 10,
                    align: 'centre',
                    anchor: 'centre',
                },
                size: {
                    width: 1.5,
                    height: 1.2,
                    depth: 0.12
                },
                timing: {
                    delay: 3.4,
                    duration: 0.5
                },
                frameThickness: 0.12,
                face: {
                    color: 0xffffff,
                    image: {
                        src: '/images/request-service_hires.png',
                        fit: 'contain',
                        rotationDegrees: 0,
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