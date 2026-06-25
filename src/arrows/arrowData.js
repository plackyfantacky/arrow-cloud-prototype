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
            
            ['bendUp', 3],
        ],
        timing: {
            delay: 0,
            duration: 2,
        },
        components: [
            {
                type: 'panel',
                name: 'test-screen-2',
                placement: {
                    segmentIndex: 2,
                    align: 'centre',
                    anchor: 'centre',
                    offset: {
                        side: -0.8
                    }

                },
                size: {
                    width: 2,
                    height: 1.2,
                    depth: 0.12
                },
                timing: {
                    delay: 0.5,
                    duration: 0.5
                },
                frameThickness: 0.12
            }
        ]
    },
];