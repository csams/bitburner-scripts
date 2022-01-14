import { theNet } from "net.js"

/** @param {NS} ns **/
function getPortOpeners(ns) {
    let openers = { "BruteSSH.exe": ns.brutessh, "FTPCrack.exe": ns.ftpcrack, "relaySMTP.exe": ns.relaysmtp, "HTTPWorm.exe": ns.httpworm, "SQLInject.exe": ns.sqlinject };
    let res = [];
    for (const file in openers) {
        if (ns.fileExists(file)) {
            res.push(openers[file]);
        }
    }
    return res;
}

/** @param {NS} ns **/
function openPorts(ns, target) {
    for (const opener of getPortOpeners(ns)) {
        opener(target);
    }
}

/** @param {NS} ns **/
function getOwnable(ns) {
    const numPortOpeners = getPortOpeners(ns).length;
    let res = []
    for (const host of theNet({ns: ns})) {
        if (ns.getServerNumPortsRequired(host.name) <= numPortOpeners && !ns.hasRootAccess(host.name)) {
            res.push(host);
        }
    }
    return res;
}

/** @param {NS} ns **/
export async function main(ns) {
    let ownable = getOwnable(ns);
    if(ownable.length > 0) {
        for (const host of ownable) {
            openPorts(ns, host.name);
            ns.nuke(host.name);
        }
    }
}
