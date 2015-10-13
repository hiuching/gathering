;define([
  "marionette"
],

function (Marionette) {

    var Modal = Backbone.Marionette.Region.extend({
      el: "#modal",

      constructor: function () {
        _.bindAll(this);
        Backbone.Marionette.Region.prototype.constructor.apply(this, arguments);
        this.on("show", this.showModal, this);
        this.on("hide", this.hideModal, this);
        this.on("close", this.hideModal, this);
      },

      getEl: function (selector) {
        var $el = $(selector);
        $el.on("hidden", this.cancelModal);
        $el.on("hidden", this.close);
        $el.on("hide", this.close);
        return $el;
      },

      showModal: function (view) {
        view.on("close", this.hideModal, this);
        this.$el.modal('show');
      },

      hideModal: function () {
        this.$el.modal('hide');
        $('.modal-backdrop').remove();
      },
      
      cancelModal: function (e) {
        QuestCMS.vent.trigger("modal:cancelled", e);
      }
    });

    return Modal;
   
});