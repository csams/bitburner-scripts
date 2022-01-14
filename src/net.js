/** @param {NS} ns **/
export function theNet({ ns, start = "home", pattern = ".*" }) {
    let seen = new Set();
    let res = [];

    let frontier = [{ name: start, path: [start] }];
    while (frontier.length > 0) {
        let cur = frontier.pop();
        if (!seen.has(cur.name)) {
            seen.add(cur.name);
        }

        for (const host of ns.scan(cur.name)) {
            if (!seen.has(host)) {
                let path = Array.from(cur.path);
                let node = { name: host, path: path.concat(host) };
                frontier.push(node);
                if (host.match(pattern)) {
                    res.push(node);
                }
            }
        }
    }
    return res;
}

/** @param {NS} ns **/
export async function main(ns) {
    let pattern = (ns.args.length == 0) ? ".*" : ns.args[0];
    let start = ns.getHostname();

    for (const host of theNet({ ns: ns, start: start, pattern: pattern })) {
        ns.tprintf("%s", host.path.slice(1).map((p) => `connect ${p}`).join("; "));
    }
}
