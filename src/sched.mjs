/*
This module implements a "hack, weaken, grow, weaken" scheduling strategy.

It uses a priority queue to hold work to do, and each task has start and end
times calculated just before it's enqueued.

The scheduler runs an infinite loop that checks the queue for tasks with start
times that occur before or at the present time. It removes them from the queue,
executes them, and inserts them into a running list.

The scheduler starts with a queue that has hack, weaken, grow, and weaken tasks
in it.

To calculate a task's end time, the existing task with an end time furthest in
the future is found. The new item's end time is set to the found end time plus a
small gap. Its start time is calculated based on its end time and duration. Then
the start time is potentially adjusted forward so that it falls after a weaken
ends but before a hack or grow ends. The end time is then adjusted again based
on this new start time.
*/
import { Weaken, Hack, Grow } from "./work.mjs";

let epoch = performance.now();
let gap = 500;

let queue = [];
let running = [];

/*
Create a queue with initial hack, weaken, grow, and weaken tasks.
*/
function primeThePump(ns, target) {
    let weakenTime = ns.getWeakenTime(target);
    let hack = new Hack({ duration: ns.getHackTime(target) });
    let hackWeaken = new Weaken({ duration: weakenTime });
    let grow = new Grow({ duration: ns.getGrowTime(target) });
    let growWeaken = new Weaken({ duration: weakenTime });

    growWeaken.shift(gap * 3);
    grow.setEnd(growWeaken.end - gap);
    hackWeaken.setEnd(grow.end - gap);
    hack.setEnd(hackWeaken.end - gap);

    return [hack, hackWeaken, grow, growWeaken];
}

/*
Find the closest time to originalStartTime that occurs after a weaken ends but
before a hack or grow ends.

Never adjust originalStartTime backward.
*/
function findGoodStartTime(work) {
    let originalStartTime = work.start;

    // w holds all the elements in the running and queue lists
    let w = Array.from(running);
    let q = Array.from(queue);
    w.push(...q);

    // start whenever we want if there's nothing to schedule around.
    if (w.length == 0) {
        return originalStartTime;
    }

    // Since end times are calculated to put tasks in hack, weaken, grow, weaken
    // order, this sort will reinforce that order.
    w.sort((a, b) => a.end - b.end);

    let taskBefore = null;
    let taskAfter = null;
    let weakenAfter = null;
    let i = 0;

    // For the start time, find the task that ends immediately before it and immediately after it.
    // Find the next weaken task.
    for (i in w) {
        let c = w[i];
        if (c.end < originalStartTime) {
            // this is the task that ends soonest before originalStartTime.
            taskBefore = c;
        } else {
            // this is the task that ends soonest after originalStartTime.
            taskAfter = c;

            // this is the weaken that ends soonest after the taskAfter ends.
            for (const a of w.slice(i + 1)) {
                if (a instanceof Weaken) {
                    weakenAfter = a;
                    break;
                }
            }
            break;
        }
    }

    // the task list w isn't empty, so at least one of taskBefore and taskAfter
    // will be non-null.

    // case where nothing is scheduled before we want to start.
    if (taskBefore === null) {
        // if we're not starting too close to the ending of something, use the
        // original time.
        if (originalStartTime <= taskAfter.end - Math.floor(gap / 2)) {
            return originalStartTime;
        }

        // otherwise, schedule just after the nearest weaken.
        if (weakenAfter !== null) {
            return weakenAfter.end + Math.floor(gap / 2);
        }

        throw new Error("taskBefore: nothing to schedule before and no future weaken.");
    }

    // case where the task ending right before we want to start is a Weaken.
    if (taskBefore instanceof Weaken) {
        // we know the taskAfter, if it exists, is NOT a Weaken
        if (taskAfter !== null) {
            // if our start time is between the weaken and the next task with sufficient buffer, just use it.
            let space = Math.floor(gap / 4);
            if (originalStartTime >= taskBefore.end + space && originalStartTime <= taskAfter.end - space) {
                return originalStartTime;
            }

            // otherwise, if we have a weaken that follows, schedule just past its end.
            if (weakenAfter !== null) {
                return weakenAfter.end + space;
            }

            // the weaken that we need hasn't been scheduled yet. Since we're following a weaken
            // and have a little buffer, schedule just before the next task starts.
            return taskAfter.end - space;
        }

        // there is no taskAfter, so schedule a little bit after the previous task if needed.
        return Math.max(originalStartTime, taskBefore.end + Math.floor(gap / 2));
    }

    // the task ending before us is not a weaken, so the next task will be one,
    // and we need to start after it.
    if (taskAfter !== null) {
        return taskAfter.end + Math.floor(gap / 2);
    }

    throw new Error("taskAfter !== null: taskAfter was null after all.");
}

// TODO
function isRunning(ns, w) {
    return true;
}

// TODO
function runTask(ns, t) {

}

export function scheduler({ ns, controller, target } = {}) {
    let keys = ["Hack", "Weaken", "Grow", "Weaken"];

    let classes = {
        "Hack": Hack,
        "Weaken": Weaken,
        "Grow": Grow
    };

    let next = 0;
    while (true) {
        if (queue.length == 0) {
            queue = primeThePump(ns, target);
        }

        // herp derp priority queue
        queue.sort((a, b) => a.end - b.end);

        let times = {
            "Hack": ns.getHackTime(target),
            "Weaken": ns.getWeakenTime(target),
            "Grow": ns.getGrowTime(target)
        };

        // keep the queue full enough that we don't have dead time. I'm using
        // the number of gaps that could fill the duration of the longest task.
        // This should probably be much shorter.
        while (queue.length <= Math.floor(Math.max(...Object.values(times)) / gap)) {
            let key = keys[next];
            let Work = classes[key];
            let duration = times[key];

            let newWork = new Work({ host: controller, duration: duration, args: [target] });
            newWork.setEnd(queue[queue.length - 1].end + gap);

            let newStart = findGoodStartTime(newWork);
            newWork.setStart(newStart);

            queue.push(newWork);
            next = (next + 1) % key.length;
        }

        let now = performance.now() - epoch;
        let newQueue = []
        for (const i of queue) {
            let w = queue[i];
            if (w.start <= now) {
                runTask(ns, w);

                //shift remaining tasks out by however long the task was delayed in starting.
                for (const r of queue.slice(i + 1)) {
                    r.shift(now - start);
                }
                running.push(w);
            } else {
                newQueue.push(w);
            }
        }
        queue = newQueue;

        // clean up the running list
        let newRunning = [];
        for (const r of running) {
            if (isRunning(ns, r)) {
                newRunning.push(r);
            }
        }
        running = newRunning;
    }
}