/*********************************************
 * PubSub module
 *
 * author: Don Lee
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/
 
;define([
],

function () {


/*********************************************
 * Main function (export)
 *********************************************/
    var PubSub = function () {
      //console.log('new PubSub');
      this.topics = [];
      this.subUid = -1;
    };

    
/*********************************************
 * functions
 *********************************************/
 
    /*
     * publisher to fire the event "topic" with optional arguments "options"
     *
     * @param {String} topic        subscribed topic for the PubSub system
     * @param {String} publisher    name of the publisher module
     * @param {Object} options      optional parameters passed by the publisher
     */
    PubSub.prototype.publish = function (topic, publisher, options) {
          if (!this.topics[topic]) {
            return false;
          }
          
          var subscribers = this.topics[topic];
          var len = subscribers ? subscribers.length : 0;
          
          while (len--) {
            subscribers[len].callback(topic, publisher, options);
          }
          return this;
    };
    
    
    /*
     * subscribe to the event "topic" and will trigger the callback function "callback" when the event "topic" is fired
     *
     * @param {String} topic        subscribed topic for the PubSub system
     * @param {String} subscriber   name of the subscriber module
     * @param {Function} callback   callback function with 3 arguments
     *                              topic (string) subscribed topic
     *                              publisher (string) name of publisher to trigger the topic
     *                              options (object) optional parameters passed by the publisher
     */
    PubSub.prototype.subscribe = function (topic, subscriber, callback) {
          if (!this.topics[topic]) {
            this.topics[topic] = [];
          }
          
          var token = (++this.subUid).toString();
          this.topics[topic].push({
            token: token,
            subscriber: subscriber,
            callback: callback
          });
          return token;
    };
      
      
    PubSub.prototype.unsubscribe = function (token) {
          for (var n in this.topics) {
            if (this.topics[n]) {
              for (var i = 0, j = this.topics[n].length; i < j; i++) {
                if (this.topics[n][i].token === token) {
                  this.topics[n].splice(i, 1);
                  return token;
                }
              }
            }
          }
          return this;
    };
      
      
    PubSub.prototype.numberOfSubscribers = function (topic) {
          if (!this.topics[topic]) {
            return 0;
          }
          var subscribers = this.topics[topic];
          var len = subscribers ? subscribers.length : 0;
          return len;
    };
      
      
    PubSub.prototype.getInfo = function () {
          console.log(this.topics);
    };
      
      
    PubSub.prototype.getSubscriberList = function (topic) {
        if (!this.topics[topic]) {
          return [];
        }
        var subscribers = this.topics[topic];
        return subscribers;
    };
    
    
    
/*********************************************
 * Return
 *********************************************/
    return PubSub;
    
});
