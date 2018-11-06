// dependencies
let fs = require('fs'); // filesystem reader.
let vdf = require('simple-vdf-mstan'); //translating VDF <-> JSON
let deepmerge = require('deepmerge'); // recursive json reading
let readdirp = require('readdirp'); // recursive dir reading
let mkdirp = require('mkdirp'); // create directories that don't exist
let debug = require('debug')('HUDGEN:generator');

let { copy, validateVDF } = require('./lib.js');



// configuration for readdirp
let config = {
    root: __dirname + '/src/diff/', // our "base file list" is user modified files
    fileFilter: [ '*.res', '*.txt', '*.vdf'] // txt for animations, res for all else
}

// run readdirp with the above config
readdirp(config)
    .on('data', (entry) => {
        let fileType = entry.name.split('.')[1];

        if(fileType == 'res') {
            generate(entry);
        } else if (fileType == 'txt') {
            copy(entry,'output');
        } else if (fileType == 'vdf') {
            copy(entry,'output');
        }
    })

// a function to take a user VDF piece, and merge it into the base file
function generate(entry) {
    let { path, parentDir, fullParentDir } = entry;
    debug(`Handling data for ${path} (${fullParentDir})`)

    let custom = fs.readFileSync(`${__dirname}/src/diff/${path}`, 'utf8');
        custom = validateVDF(custom);
        custom = vdf.parse(custom);

    let original = fs.readFileSync(`${__dirname}/src/official/${path}`, 'utf8');
        original = validateVDF(original);
        original = vdf.parse(original);

    let merged = deepmerge(original,custom);
        merged = vdf.stringify(merged, true);

    mkdirp(`${__dirname}/src/output/${parentDir}`, (err) => {
        if(err) throw new Error(err);
        fs.writeFileSync(`${__dirname}/src/output/${path}`, merged, 'utf8');
    });
}
