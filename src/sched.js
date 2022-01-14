import { remoteExec } from "remote-exec.js"

/** @param {NS} ns **/
export async function main(ns) {
    if (ns.args.length != 2) {
        ns.tprintf("Must specify a controller and a server to target.");
        ns.exit();
    }

    let controller = ns.args[0];
    let target = ns.args[1];

    let running = [];
    let queue = [];

    let t = performance.now() // start time;
    let gap = 200;  // millis between endings

    // we want to start as many grow and hack processes as possible with weakens ending right after both end.
    // we know what is running currently and what is scheduled to run.
    function decideWhatToDo() {
        let weakenTime = ns.getWeakenTime(target);
        let growTime = ns.getGrowTime(target);
        let hackTime = ns.getHackTime(target);
    }

    // work item has a start time, script, args, threads, ramUsed.
    function doWork(w) {
        return remoteExec(ns, work.script, controller, { threads: work.threads, args: work.args });
    }

    while (true) {
        decideWhatToDo();

        queue.sort((a, b) => a.startTime - b.startTime);

        let newQueue = [];
        let newRunning = [];

        for (const work of queue) {
            if (work.startTime <= t) {
                let proc = doWork(work);
                running.push(proc);
            } else {
                newQueue.push(work);
            }
        }
        if (queue.length != newQueue.length) {
            queue = newQueue;
        }

        for (const proc of running) {
            if (ns.isRunning(proc.script, proc.controller, ...proc.args)) {
                newRunning.push(proc);
            }
        }
        if (running.length != newRunning.length) {
            running = newRunning;
        }

        await ns.sleep(1);
        t = performance.now();
    }
}
