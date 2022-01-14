/** @param {NS} ns **/
export async function remoteExec(ns, script, target, { threads = 1, args } = {}) {
    await ns.scp(script, "home", target);
    let pid = ns.exec(script, target, threads, ...args);
    return {
        pid: pid,
        host: target,
        script: script,
        args: args,
        threads: threads
    };
}

/** @param {NS} ns **/
export async function waitFor(ns, ps) {
    while (ns.isRunning(ps.script, ps.host, ...ps.args)) {
        await ns.sleep(10);
    }
}
