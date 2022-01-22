
class Work {
    constructor({script, host, start, end, args} = {}) {
        this.script = script;
        this.host = host;
        this.start = start;
        this.end = end;
        this.args = args;
    }

    setStart(start) {
        let duration = this.duration();
        this.start = start;
        this.end = start + duration;
    }

    setEnd(end) {
        let duration = this.duration();
        this.end = end;
        this.start = end - duration;
    }

    shift(delta) {
        this.start += delta;
        this.end += delta;
    }

    duration() {
        return this.end - this.start;
    }

    startsBefore(o) {
        return this.start < o.start;
    }

    endsBefore(o) {
        return this.end < o.end;
    }
}

export class Weaken extends Work {
    constructor({host, duration, args}) {
        super({script: "weaken.js", host: host, start: 0, end: duration, args: args})
    }
}

export class Hack extends Work {
    constructor({host, duration, args}) {
        super({script: "hack.js", host: host, start: 0, end: duration, args: args})
    }
}

export class Grow extends Work {
    constructor({host, duration, args}) {
        super({script: "grow.js", host: host, start: 0, end: duration, args: args})
    }
}