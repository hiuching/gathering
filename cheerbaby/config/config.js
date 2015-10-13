process.env.NODE_ENV = process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : 'production';
console.log(process.env.NODE_ENV);


/*
 * author: Don Lee
 * date: 2013-09-12T13:11:00Z
 *
 * Class: Config
 */
var Config = (function () {

  // Instance stores a reference to the Singleton
  var instance;

	function init() {

	// Singleton

		// Private methods and variables

		return {
    
        apiKey : 'hbvnpgfky7q9531',
        apiSecret : '0j7d7kngniwyf4j',
        app_title : "CheerBaby",
        ip_addr : '127.0.0.1',
        listening_port : '8026',   
        authenticationEngine : 'mongo', // mongo or folder
        datapath : './data',
        enable_ssl : false,
        langauges : ['en-us', 'zh-hant'],
        skipAuthentication : false,
        authentcationTimeout : 10000,
				htmlPath: 'public',
        fileLimit : '30mb',
				skipCheckPermission: false,
				
        nodemailer : {
          service: "Gmail",
          auth: {
						user: "enquiry@cheerbaby.hk",
						pass: "ab1234cd"
          }
        },
        
        
        mongoDB : {
						host: "127.0.0.1",
            port: 27017,
            user: "cheerbaby",
            password: "cheer4321",
            dbname: "cheerbaby",
            debug: false,
            skipUserAuthentication: false 
        },
        
        // Public methods and variables
				getHost : function () {
					var protocol = (this.enable_ssl) ? 'https://' : 'http://';
					return protocol + this.ip_addr + ':' + this.listening_port;
				},
				
				getMemberHost: function () {
				  var protocol = (this.enable_ssl) ? 'https://' : 'http://';
					return protocol + 'member.cheerbaby.hk' ;
				},

        // Public methods for NODE_ENV
        development: function() {
          this.skipAuthentication = false;
					this.ip_addr = '127.0.0.1';
					this.listening_port = '8026',
					this.mongoDB.host = "210.245.150.19";
					this.mongoDB.dbname = 'cheerbabydev';
          return this;
        },
  
        production: function () {
          this.skipAuthentication = false;
				this.mongoDB.dbname = 'cheerbaby';
          return this;
        },
        
        testing : function () {
          this.skipAuthentication = false;
					this.ip_addr = '127.0.0.1';
					this.listening_port = '8026',
					this.htmlPath = 'public_mother';
					this.mongoDB.host = "210.245.150.19";
					this.mongoDB.dbname = 'cheerbabydev';
          return this;
        }
		};

	};

  
	return {

    // Get the Singleton instance if one exists
    // or create one if it doesn't
    getInstance: function () {
  
      if ( !instance ) {
        instance = init();
        
        if (instance[process.env.NODE_ENV] && (typeof instance[process.env.NODE_ENV] === 'function')) {
            instance[process.env.NODE_ENV]();
        }
      }
  
      return instance;
    }

	};

})();


module.exports = Config;
