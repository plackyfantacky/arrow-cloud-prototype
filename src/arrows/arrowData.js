export const animationSettings = {
    timelineDuration: 8,
    speed: 1,
    isPlaying: true,
    isLooping: true,
    debugMode: false
}

export const cameraTrack = [
    {
        time: 0,
        position: { x: 0, y: 5, z: 12 },
        target: { x: 0, y: 0, z: 0 }
    },
    {
        time: 3,
        position: { x: -2, y: 4, z: 9 },
        target: { x: 0, y: 0.5, z: 0 }
    },
    {
        time: 6,
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
        name: 'demo',
        origin: [-2, 0, 0],
        initialDirection: '+x',
        initialNormal: '+y',
        moves: [
            ['forward', 3],
            ['bendUp', 2],
            ['bendUp', 2],
            ['turnRight', 2],
            ['turnRight', 2],
            ['bendUp', 1.75],
            ['bendUp', 2],
            ['turnRight', 3],
        ],
        timing: {
            delay: 0,
            duration: 8,
        }
    },
];