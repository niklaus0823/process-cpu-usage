import * as os from "os";
import {spawn} from "child_process";

/**
 * 执行 shell
 *
 * @param {string} cmd
 * @param {string[]} args
 * @param {Function} cb
 */
function exec(cmd: string, args: string[], cb: (err: Error, stdout?: string, code?: number) => void) {
    let executed = false;
    let stdout = '';
    let stderr = '';

    let ch = spawn(cmd, args);
    ch.stdout.on('data', (d) => {
        stdout += d.toString();
    });

    ch.stderr.on('data', (d) => {
        stderr += d.toString();
    });

    ch.on('error', (err: Error) => {
        if (executed) return;
        // callback
        executed = true;
        cb(err);
    });

    ch.on('close', function (code, signal) {
        if (executed) return;

        // callback
        executed = true;
        if (stderr) {
            return cb(new Error(stderr));
        }

        cb(null, stdout, code);
    });
}

/**
 * 获取 pid 信息.
 * @param  {Number[]} pids
 * @param  {Function} cb
 */
export function ps(pids: number[], cb: (err: Error, stat?: any) => void) {
    const pArg = pids.join(',');
    const args = ['-o', 'etime,pid,ppid,pcpu,time', '-p', pArg];

    exec('ps', args, (err: Error, stdout: string, code: number) => {
        if (err) return cb(err);
        if (code === 1) {
            return cb(new Error('No maching pid found'));
        }
        if (code !== 0) {
            return cb(new Error('pidusage ps command exited with code ' + code));
        }

        let now = new Date().getTime();
        let statistics = {};
        let output = stdout.split(os.EOL);
        for (let i = 1; i < output.length; i++) {
            let line = output[i].trim().split(/\s+/);
            if (!line || line.length !== 5) {
                continue;
            }

            let etime = line[0];
            let pid = parseInt(line[1], 10);
            let ppid = parseInt(line[2], 10);
            let cpu = line[3];
            let ctime = line[4];

            statistics[pid] = {
                pid: pid,
                ppid: ppid,
                cpu: cpu,
                ctime: ctime,
                elapsed: etime,
                timestamp: now
            };
        }

        cb(null, statistics);
    });
}