const Counter = require("../models/counter");

/**
 * Generates sequential Order Serial ID in format: IS[A-Z][101, 102, 103...]
 * Pattern:
 * 101 -> ISA101
 * 102 -> ISB102
 * ...
 * 126 -> ISZ126
 * 127 -> ISA127
 * Alphabet rotates A-Z continuously while number increments sequentially.
 */
async function getNextOrderSerial() {
    const counter = await Counter.findOneAndUpdate(
        { name: "orderSerial" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    let seq = counter.seq;
    if (seq < 101) {
        await Counter.updateOne({ name: "orderSerial" }, { $set: { seq: 101 } });
        seq = 101;
    }

    const offset = seq - 101;
    const letter = String.fromCharCode(65 + ((offset % 26 + 26) % 26));
    return `IS${letter}${seq}`;
}

module.exports = {
    getNextOrderSerial
};
