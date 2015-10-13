// to optimize
// cd root folder
// node node_modules/requirejs/bin/r.js -o build.js
({
    baseUrl: "public/js",
    mainConfigFile: 'public/js/main.js',
    name: "main",
    out: "public/js/main-built.js",
    preserveLicenseComments: false,
    paths: {
      config: "empty:",
      tinymce: "empty:"
    }
})
