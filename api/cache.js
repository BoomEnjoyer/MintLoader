class Cache {
    constructor() {
        this.cache = {}
    }

    set(key, value) {
        this.cache[key] = value;
    }

    get(key) {
        if (typeof this.cache[key] == 'undefined') {
            return null;
        }

        return this.cache[key];
    }

    reset() {
        this.cache = {}
    }
}

const cache = new Cache();

module.exports = cache