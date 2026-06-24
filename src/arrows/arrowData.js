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
            duration: 5,
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
            ['bendDown', 3],
        ],
        timing: {
            delay: 0.5,
            duration: 5.5,
        }
    },
    {
        name: 'right-1',
        origin: [6, 0, 1.2],
        initialDirection: '-x',
        initialNormal: '+y',
        moves: [
            ['forward', 2],
            ['turnRight', 1],
            ['turnLeft', 2],
            ['bendUp', 1],
            ['bendDown', 3],
        ],
        timing: {
            delay: 0.25,
            duration: 5,
        },
    },
];