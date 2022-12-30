const jsconfuser = require("js-confuser");
const path = require("path");
const fs = require("fs");

async function obfuscate() {
    const dirUtils = path.join(process.cwd(), 'client', 'utils/');
    const utils = fs.readdirSync(dirUtils);
    let files = [];
    for (let i = 0; i < utils.length; i++) {
        files.push(dirUtils + utils[i]);
    }

    files.push(path.join(process.cwd(), 'client', 'client.js'));
    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        await obfuscateFile(file);
    }
}

async function desobfuscate() {
    const dirUtils = path.join(process.cwd(), 'client', 'utils/');
    const utils = fs.readdirSync(dirUtils);
    let files = [];
    for (let i = 0; i < utils.length; i++) {
        files.push(dirUtils + utils[i]);
    }

    files.push(path.join(process.cwd(), 'client', 'client.js'));
    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        cleanFile(file);
    }
}

async function cleanFile(i) {
    if (i.endsWith("_clean")) {
        return;
    } else {
        const input = fs.readFileSync(`${i}_clean`).toString();
        fs.rmSync(i);
        fs.writeFileSync(i, input);
        fs.rmSync(`${i}_clean`);
    }
}

async function obfuscateFile(i) {
    const input = fs.readFileSync(i).toString();

    const output = await jsconfuser.obfuscate(input, {
        "calculator": true,
        "compact": true,
        "controlFlowFlattening": 0.25,
        "deadCode": 0.01,
        "dispatcher": 0.5,
        "duplicateLiteralsRemoval": true,
        "globalConcealing": true,
        "hexadecimalNumbers": true,
        "identifierGenerator": "randomized",
        "minify": true,
        "movedDeclarations": true,
        "objectExtraction": true,
        "opaquePredicates": 0.1,
        "renameGlobals": true,
        "renameVariables": true,
        "shuffle": true,
        "stack": 0.5,
        "stringConcealing": true,
        "stringSplitting": 0.25,
        "target": "node"
    });

    fs.writeFileSync(i, output);
    fs.writeFileSync(`${i}_clean`, input);
}

module.exports = {
    obfuscate,
    desobfuscate
}
