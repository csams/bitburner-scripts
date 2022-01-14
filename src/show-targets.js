import { getOwned } from "owned.js"

function byKey(key) {
    return function (a, b) {
        if (typeof a[key] === 'number') {
            return b[key] - a[key];
        }
        return a[key].localeCompare(b[key])
    }
}

/** @param {NS} ns **/
export async function main(ns) {
    let sortKey = (ns.args.length == 1) ? ns.args[0] : "hackChance";
    let res = []
    for (const host of getOwned(ns)) {
        let minSecLvl = ns.getServerMinSecurityLevel(host.name);
        let secLvl = ns.getServerSecurityLevel(host.name);
        let growthRate = ns.getServerGrowth(host.name);
        let weakenThreads = (secLvl - minSecLvl) / 0.05;
        let weakenTime = ns.getWeakenTime(host.name) / 1000;
        let growTime = ns.getGrowTime(host.name) / 1000;
        let hackTime = ns.getHackTime(host.name) / 1000;
        let hackChance = ns.hackAnalyzeChance(host.name);
        res.push({
            name: host.name,
            minSecLvl: minSecLvl,
            secLvl: secLvl,
            growthRate: growthRate,
            weakenThreads: secLvl == 0 ? 0: weakenThreads,
            weakenTime: secLvl == 0 ? 0 : weakenTime,
            growTime: secLvl == 0 ? 0 : growTime,
            hackTime: secLvl == 0 ? 0 : hackTime,
            hackChance: hackChance,
            availMoney: ns.getServerMoneyAvailable(host.name),
            maxMoney: ns.getServerMaxMoney(host.name),
        });
    }
    
    let formats = {
        "name": { header: "%-20s", body: "%-20s" },
        "minSecLvl": { header: "%15s", body: "%15d" },
        "secLvl": { header: "%15s", body: "%15d" },
        "growthRate": { header: "%15s", body: "%15d" },
        "weakenThreads": { header: "%15s", body: "%15.2f" },
        "weakenTime": { header: "%15s", body: "%15.2f" },
        "growTime": { header: "%15s", body: "%15.2f" },
        "hackTime": { header: "%15s", body: "%15.2f" },
        "hackChance": { header: "%15s", body: "%15.2f" },
        "availMoney": { header: "%20s", body: "%20d" },
        "maxMoney": { header: "%20s", body: "%20d" },
    };

    if (res.length > 0) {
        let fmt = Object.keys(formats).map((k) => formats[k].header).join("");
        ns.tprintf(fmt, ...Object.keys(formats));
        for (const p of res.sort(byKey(sortKey))) {
            fmt = Object.keys(formats).map((k) => formats[k].body).join("");
            ns.tprintf(fmt, ...Object.values(p));
        }
    }
}
