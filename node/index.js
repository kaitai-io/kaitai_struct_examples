var fs = require("fs");
var KaitaiStructCompiler = require("kaitai-struct-compiler");
var KaitaiStruct = require("kaitai-struct");
var KaitaiStream = KaitaiStruct.KaitaiStream;
var yamljs = require("yamljs");
var zlib = require('zlib');

console.log("Welcome to the Kaitai Struct example node.js app!");
console.log();

showCompilerInfo();
example_generateAllParsers();
example_parseZipFile();

function showCompilerInfo() {
    var compiler = new KaitaiStructCompiler();
    console.log("Kaitai Struct Compiler information:");
    console.log(" - version: " + compiler.version);
    console.log(" - build date: " + compiler.buildDate);
    console.log(" - supported languages: " + compiler.languages.join(", "));
    console.log();
}

function example_generateAllParsers() {
    console.log("=============================");
    console.log("Example: generate all parsers");
    console.log("=============================");
    
    console.log("  Loading zip.ksy...");
    var zipKsyContent = yamljs.parseFile("zip.ksy");

    mkdir("output");
    mkdir("output/src"); // for Java code

    var debugSupported = ["java", "javascript", "ruby"];
    var disabledLanguages = ["go"];

    var compiler = new KaitaiStructCompiler();
    compiler.languages.forEach(function(lang) {
        [false, true].forEach(function(isDebug){
            if (isDebug && debugSupported.indexOf(lang) === -1 || disabledLanguages.indexOf(lang) !== -1) return;
            
            console.log("  Generating " + lang + (isDebug ? " (debug)" : "") + " code...");

            compiler.compile(lang, zipKsyContent, null, isDebug ? true : false).then(function(files) {
                Object.keys(files).forEach(function(fileName) {
                    var fileContent = files[fileName];
                    var outFn = isDebug ? fileName.replace(".", ".debug.") : fileName;
                    fs.writeFileSync("output/" + outFn, fileContent);
                });
            }, function(err){
                console.log("  Error while generating " + lang + (isDebug ? " (debug)" : "") + " code", err);
            });
        });
    });
    
    console.log();
}

function example_parseZipFile() {
    console.log("===========================");
    console.log("Example: parsing a zip file");
    console.log("===========================");
    
    console.log("  Loading zip.ksy...");
    var zipKsyContent = yamljs.parseFile("zip.ksy");
    
    console.log("  Loading input file (sample1.zip)...");
    var inputBinary = fs.readFileSync("sample1.zip");

    console.log("  Generating JS .zip parser...");
    var compiler = new KaitaiStructCompiler();
    compiler.compile("javascript", zipKsyContent, null, false).then(function(files) {
        var parserCode = files["Zip.js"];
        eval(parserCode);
        
        console.log("  Parsing file...");
        var zip = new Zip(new KaitaiStream(inputBinary, 0));
        
        console.log();
        console.log("  Zip contents:");
        zip.sections.forEach(function(section) {
           if (section.body instanceof Zip.LocalFile) {
               var hdr = section.body.header;
               var isFolder = hdr.fileName.charAt(hdr.fileName.length - 1) === '/';
               console.log("   - [" + (isFolder ? "D" : "F") + "] " + hdr.fileName + (isFolder ? "" : " (" + hdr.uncompressedSize + " bytes)"));
               
               if(!isFolder) {
                   var decompressed = zlib.inflateRawSync(new Buffer(section.body.body));
                   console.log("     - contents: '" + decompressed.toString() + "'");
               }
           }
        });
    });
}

function mkdir(path) {
    if(!fs.existsSync(path))
        fs.mkdirSync(path);
}