/** @param {NS} ns **/
export async function main(ns) {
    if (ns.args.length != 1) {
        ns.tprint("Must pass a server.");
        ns.exit();
    }

    await ns.hack(ns.args[0]);
}
