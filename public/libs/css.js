(function() {
 
define({
load: function(name, req, load, config) {
var url = req.toUrl(name + '.css');
var css = document.createElement('link');
css.type = "text/css";
css.rel = "stylesheet";
css.href = url;
var heads = document.getElementsByTagName('head')
if (heads && heads.length > 0) {
heads[0].appendChild(css);
load(css);
} else {
load.error();
}
}
});
 
})();