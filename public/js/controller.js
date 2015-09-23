;define([
  "app"
],

function (App) {


/*********************************************
 * Main function (export)
 *********************************************/
var Controller = {

        resolve: function (alias) {
        var self = this;
                //console.log('enter controller');
                alias = alias || "";
		if ((alias === "") || (alias == "homepage")) { 
                var layoutName = "toilet";
                //console.log('enter controller.resolve calendar');
                App.initializeLayout(layoutName);
			self.toilet(alias);
                        
                };
        },
        toilet: function (alias) {
        //console.log('enter controller calendar');
        App.vent.trigger("toilet:resolve", alias);
        }
};
/*********************************************
 * Return
 *********************************************/
    return Controller;
   
});