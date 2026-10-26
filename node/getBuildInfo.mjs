import { execFileSync } from 'node:child_process';

function git(...arguments_) {
    return execFileSync('git', arguments_, {
        encoding: 'utf8',
    }).trim();
}

export function getBuildInfo() {
    const mainCommits = Number(git('rev-list', '--count', 'main'));
    const totalCommits = Number(git('rev-list', '--count', '--branches'));

    return {
        identifier: `B${mainCommits}.${totalCommits}`,
        mainCommits,
        totalCommits,
        commit: git('rev-parse', '--short', 'HEAD'),
        branch: git('branch', '--show-current'),
    };
}