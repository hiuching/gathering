// to optimize
// cd root folder
// node node_modules/requirejs/bin/r.js -o build.js
({
    baseUrl: "public_mother/js",
    mainConfigFile: 'public_mother/js/main.js',
    name: "main",
    out: "public_mother/js/main-built.js",
    preserveLicenseComments: false,
    paths: {
      config: "empty:",
      tinymce: "empty:"
    }
})
