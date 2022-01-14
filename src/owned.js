import { theNet } from "net.js"

/** @param {NS} ns **/
export function getOwned(ns) {
    let res = [];
    for (const host of theNet({ns: ns})) {
        if (ns.hasRootAccess(host.name)) {
            res.push(host);
        }
    }
    return res;
}
