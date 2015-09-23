;define([
'marionette',
'bootstrap-select',
'jstarbox',
'text!tpl/toilet.html',
'async!https://maps.googleapis.com/maps/api/js?v=3.exp&signed_in=true'
], function(Marionette,bootstrapSelect, jstarbox, templateString){
/*********************************************
 * Templates
 *********************************************/
var tplToiletCompositeView = $('#toiletCompositeView', '<div>' + templateString + '</div>').html();
var tplToiletItemView = $('#toiletItemView', '<div>' + templateString + '</div>').html();
var tplToiletDetailView = $('#toiletDetailView', '<div>' + templateString + '</div>').html();
var tplToiletSearchView = $('#toiletSearchView', '<div>' + templateString + '</div>').html();
var tplMapView = $('#mapView', '<div>' + templateString + '</div>').html();
var tplNearMapView = $('#nearMapView', '<div>' + templateString + '</div>').html();
var tplMenuView = $('#menuView', '<div>' + templateString + '</div>').html();
var tplReportCompositeView = $('#reportView', '<div>' + templateString + '</div>').html();

/*********************************************
 * Configurations
 *********************************************/
var module = "toilet";
var configs = {};
var previousView = [];
/*********************************************
 * Main function (export)
 *********************************************/
var Toilet = function () {
var CachedCollection;
var CachedModel;
configs[module]  = {
        region: 'contentRegion',
        isCachedCollection: false
};
  //    $.extend(true, configs, App.Config.toJSON());

      
/*********************************************
* Listening events
*********************************************/
      
App.vent.on(module + ":displayToilet", function () {
        displayToilet();
});

App.vent.on(module + ":resolve", function (alias) {
        resolve(alias);
});
      
};      
      
var ModuleModel = Backbone.Model.extend({
        initialize: function () { 
        },  
        urlRoot: '/toilet/toilet',
        idAttribute: '_id',
        getAddress : function (){
                        return this.get('address_e');
        } ,
        getName : function (){
                        return this.get('name_e');
        }, 
        getClean : function (){
                        return this.get('clean') || 0;
        }, 
        getCid : function (){
                        return this.get('cid') || 0;
        },
        getCoordinate : function (){
                        return this.get('google_coordinate') || [0,0];
        },
        getDistrict : function (){
                        var district = this.get('districtID');
                        switch (district) {
                        case "CW": 
                                district = 'Central and Western';
                                break;
                         case "E": 
                                district = 'Eastern';
                                break; 
                         case "S": 
                                district = 'Southern';
                                break; 
                         case "Is": 
                                district = 'Islands';
                                break; 
                         case "YT": 
                                district = 'Yau Tsim';
                                break;   
                         case "MK": 
                                district = 'Mong Kok';
                                break;                        
                         case "SSP": 
                                district = 'Sham Shui Po';
                                break;     
                        case "KC": 
                                district = 'Kowloon City';
                                break;  
                        case "WTS": 
                                district = 'Wong Tai Sin';
                                break;                       
                        case "KT": 
                                district = 'Kwun Tong';
                                break;                      
                        case "TW": 
                                district = 'Tsuen Wan';
                                break;                   
                        case "KwT": 
                                district = 'Kwai Tsing';
                                break;                   
                        case "N": 
                                district = 'North';
                                break; 
                        case "TP": 
                                district = 'Tai Po';
                                break; 
                        case "SK": 
                                district = 'Sai Kung';
                                break;   
                        case "ST": 
                                district = 'Sha Tin';
                                break;     
                        case "TM": 
                                district = 'Tuen Mun';
                                break;
                        case "YL": 
                                district = 'Yuen Long';
                                break;
                        default : 
                                district = 'N/A';
                                break;
                        }
                        return district;
        }
});

var ModuleCollection = Backbone.Collection.extend({
        initialize: function () { 
        },  
        url: '/toilet/toilet',
        model: ModuleModel
});
/*********************************************
 * Backbone Collection
 *********************************************/
  var ToiletListItemViewView = Backbone.Marionette.ItemView.extend({
        template: _.template(tplToiletItemView),
        tagName:'li',
        className: 'toiletAddress list-group-item',
        id: function(){
                return this.model.cid ;
        }
});

var ToiletDetailView  = Backbone.Marionette.CompositeView.extend({
        initialize: function (){
                this.model.district = this.model.getDistrict();
                this.model.set({district: this.model.district});
                return;
        },
        onShow: function(){
                $(document).scrollTop(0);
                var previousCleans = this.model.getClean();
                var averageClean = 0;
                previousCleans.forEach(function(previousClean, index){
                averageClean = previousClean + averageClean;
                });
                if(averageClean != 0) {
                averageClean = averageClean / (previousCleans.length) ;
                }
                $('.starbox').starbox({
                average: averageClean ,
                buttons : 10,
                changeable: true,
                autoUpdateAverage: true,
                ghosting: true
                });
        },
        itemView: ToiletListItemViewView,
        tagName: 'div',
        id: 'toiletDetail',
        template: _.template(tplToiletDetailView),
        events:{
                'click #back' : 'back',
                'click #map'  :  'map',
                'click #submit' : 'submit'
        },
        back: function(){

               var view = new ToiletCompositeView({collection: CachedCollection});
                previousView.push('ToiletCompositeView');
		App.layout[configs[module]['region']].show(view); 
        },
        map : function(){
               var view = new MapView({model: this.model});
                previousView.push('MapView');
		App.layout[configs[module]['region']].show(view); 
        },
        submit : function(){
                var newClean = $('.starbox').starbox("getOption", "average");
                var previousCleans = this.model.getClean();
                previousCleans.push(newClean);
                this.model.set({clean: previousCleans});
                console.log('setted', this.model);
                this.model.save({}, {
                success: function (model) {
                console.log('saved', model);
                       var view = new ToiletCompositeView({collection: CachedCollection});
                previousView.push('ToiletCompositeView');
                        App.layout[configs[module]['region']].show(view); 
                },
                error: function (model, err) {
                        alert('save failed');
                }
          });
        }
});

var MapView = Backbone.Marionette.ItemView.extend({
      template: _.template(tplMapView),
      initialize: function(){
                },
        onShow:  function() {
        $(document).scrollTop(0);
        this.start(this.model);
        },
        start: function(model){
                var coordinates = model.getCoordinate();
                var mapOptions = {
                        zoom: 18,
                        center: { lat: coordinates[0], lng: coordinates[1]}
                };
                console.log(model.getName());
                var map = new google.maps.Map(document.getElementById('map'),mapOptions);
                marker = new google.maps.Marker({
                        position: new google.maps.LatLng(coordinates[0], coordinates[1]),
                        map: map
                });
                var infowindow = new google.maps.InfoWindow({
                        content: '<div style = "color: black;">' + model.getName() + '</div>'
                });
                
                google.maps.event.addListener(marker, 'click', function() {
                infowindow.open(map,marker);
                });
                console.log('map', map);
                return this;
        }
});  

var MapNearView = Backbone.Marionette.ItemView.extend({
      template: _.template(tplNearMapView),
      initialize: function(options){
        return this.pos = options.pos;
                },
        onShow:  function() {
        $(document).scrollTop(0);
        this.start(this.collection, this.pos);
        },
        start: function(collection, pos){
                console.log('pos', pos);
                var mapOptions = {
                        zoom: 15,
                        center: pos
                };
                var map = new google.maps.Map(document.getElementById('map'),mapOptions);
                marker = new google.maps.Marker({
                        position: pos,
                        map: map
                });
                collection.forEach(function(model, index){
                        var coordinates = model.getCoordinate();
                                marker = new google.maps.Marker({
                                        position: new google.maps.LatLng(coordinates[0], coordinates[1]),
                                        map: map,
                                        icon: "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|00D900"
                        });
                        var content =  '<div style = "color: black;">' + model.getName() + '</div>';

                        var infowindow = new google.maps.InfoWindow()

                        google.maps.event.addListener(marker,'click', (function(marker,content,infowindow){ 
                        return function() {
                        infowindow.setContent(content);
                        infowindow.open(map,marker);
                        };
                        })(marker,content,infowindow)); 
                });
                return this;
        }
});  

var ToiletCompositeView  = Backbone.Marionette.CompositeView.extend({
        itemView: ToiletListItemViewView,
        template: _.template(tplToiletCompositeView),
        appendHtml: function (collectionView, itemView, index) {
                collectionView.$("ul").append(itemView.el);
        },
        onShow: function(){
        $(document).scrollTop(0);
        },
        events:{
                'click .toiletAddress'		: 'showDetail'
        },
        showDetail: function (e){
                if(CachedCollection) {
                        var cid = e.currentTarget.id;
                        CachedCollection.models.forEach(function( model, index) {
                                if (model.cid == cid){
                                var view = new ToiletDetailView({model: model});
                                console.log(model);
                                 previousView.push('ToiletDetailView');
                                 CachedModel = model;
                                App.layout[configs[module]['region']].show(view);
                                }
                        });
                } else {
                        alert('please search again !');
                }
        }

});


var ToiletSearchView  = Backbone.Marionette.CompositeView.extend({
        itemView: ToiletListItemViewView,
        onShow: function (){
        $(document).scrollTop(0);
                  $(".selectpicker").selectpicker({
                  width: '92%',
                  title: 'chose one of follow'
                  });
                  
        if( /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ) {
        $('.selectpicker').selectpicker('mobile');
        }
        $('.selectpicker').selectpicker('show');
        $('.carousel').carousel()
        },
        template: _.template(tplToiletSearchView),
        events: {
                'click #search'			: 'search',
                'click #nearest'			: 'nearest',
                'click #nearMap'		: 'nearMap'
        },
        search: function (e){
                $('#pleaseWaitDialog').modal('show');
                $('#pleaseWaitDialog').removeClass('hide').addClass('show');

                var district = $('.selectpicker-home').val();
                var options =  {
                        action : 'findToiletByDistrictID',
                        districtID: district
                };
                fetch(options, function (err, collection, response) {
                        if (err) {
                                alert('fetch error');
                        $('#pleaseWaitDialog').removeClass('show').addClass('hide');
                        $('#pleaseWaitDialog').modal('hide');
                        } else {
                        CachedCollection = collection;
                        $('#pleaseWaitDialog').removeClass('show').addClass('hide');
                        $('#pleaseWaitDialog').modal('hide');
                        var view = new ToiletCompositeView({collection: collection});
                        previousView.push('ToiletCompositeView');
				App.layout[configs[module]['region']].show(view);
                        }
                });
        },
        nearest:  function(){
                var self = this;
                $('#pleaseWaitDialog').modal('show');
                $('#pleaseWaitDialog').removeClass('hide').addClass('show');
                if(navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(function(position) {
                        var pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                        console.log('pos', pos);
                        var options =  {
                        action : 'findNearToilet',
                        postK: pos.k,
                        postD: pos.D
                        };
                        fetch(options, function (err, collection, response) {
                        if (err) {
                                $('#pleaseWaitDialog').modal('hide');                                
                                $('#pleaseWaitDialog').removeClass('show').addClass('hide');
                                alert('fetch error');
                        } else {
                                CachedCollection = collection;
                                  $('#pleaseWaitDialog').modal('hide');                              
                                $('#pleaseWaitDialog').removeClass('show').addClass('hide');
                                var view = new ToiletCompositeView({collection: collection});
                                 previousView.push('ToiletCompositeView');
                                App.layout[configs[module]['region']].show(view);
                        }
                        });
                
                        }, function() {
                                 $('#pleaseWaitDialog').modal('hide');                       
                                $('#pleaseWaitDialog').removeClass('show').addClass('hide');
                                alert('near fail');
                                
                        });
                } else {
                        // Browser doesn't support Geolocation
                        $('#pleaseWaitDialog').removeClass('show').addClass('hide');
                        $('#pleaseWaitDialog').modal('hide');

                        alert("Browser doesn't support Geolocation");
                }
        },
        nearMap: function(){
                var self = this;
                $('#pleaseWaitDialog').modal('show');
                $('#pleaseWaitDialog').removeClass('hide').addClass('show');
                if(navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(function(position) {
                        var pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                        console.log('pos', pos);
                        var options =  {
                        action : 'findNearToilet',
                        postK: pos.k,
                        postD: pos.D
                        };
                        fetch(options, function (err, collection, response) {
                        if (err) {
                                $('#pleaseWaitDialog').modal('hide');                                
                                $('#pleaseWaitDialog').removeClass('show').addClass('hide');
                                alert('fetch error');
                        } else {
                                CachedCollection = collection;
                                  $('#pleaseWaitDialog').modal('hide');                              
                                $('#pleaseWaitDialog').removeClass('show').addClass('hide');
                                var view = new MapNearView({collection: collection, pos: pos});
                                 previousView.push('MapNearView');
                                App.layout[configs[module]['region']].show(view);
                        }
                        });
                
                        }, function() {
                                 $('#pleaseWaitDialog').modal('hide');                       
                                $('#pleaseWaitDialog').removeClass('show').addClass('hide');
                                alert('near fail');
                                
                        });
                } else {
                        // Browser doesn't support Geolocation
                        $('#pleaseWaitDialog').removeClass('show').addClass('hide');
                        $('#pleaseWaitDialog').modal('hide');

                        alert("Browser doesn't support Geolocation");
                }
        
        }

});

var MenuView  = Backbone.Marionette.CompositeView.extend({
        template: _.template(tplMenuView),
        onShow: function (){
                $(document).scrollTop(0);
                  $(".selectpicker").selectpicker({
                  width: '92%',
                  title: 'chose one of follow'
                  });
                  
        if( /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ) {
        $('.selectpicker').selectpicker('mobile');
        }
        $('.selectpicker').selectpicker('show');
        },
        events:{
        "click #nearMap" : "nearMap", 
        "click #search" : "search", 
        "click #nearList" : "nearList", 
        "click #report" : "report", 
        "click #back" : "back", 
        "click #Home" : "Home", 
        },
        nearMap: function (){
                var self = this;
                $('#pleaseWaitDialog').modal('show');
                $('#pleaseWaitDialog').removeClass('hide').addClass('show');
                if(navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(function(position) {
                        var pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                        var options =  {
                        action : 'findNearToilet',
                        postK: pos.k,
                        postD: pos.D
                        };
                        fetch(options, function (err, collection, response) {
                        if (err) {
                                $('#pleaseWaitDialog').modal('hide');                                
                                $('#pleaseWaitDialog').removeClass('show').addClass('hide');
                                alert('fetch error');
                        } else {
                                CachedCollection = collection;
                                  $('#pleaseWaitDialog').modal('hide');                              
                                $('#pleaseWaitDialog').removeClass('show').addClass('hide');
                                console.log('pos', pos, 'position', position)
                                var view = new MapNearView({collection: collection, pos: pos});
                                 previousView.push('MapNearView');
                                App.layout[configs[module]['region']].show(view);
                        }
                        });
                
                        }, function() {
                                 $('#pleaseWaitDialog').modal('hide');                       
                                $('#pleaseWaitDialog').removeClass('show').addClass('hide');
                                alert('near fail');
                                
                        });
                } else {
                        // Browser doesn't support Geolocation
                        $('#pleaseWaitDialog').removeClass('show').addClass('hide');
                        $('#pleaseWaitDialog').modal('hide');

                        alert("Browser doesn't support Geolocation");
                }
        }, 
        search:function (){
                $('#pleaseWaitDialog').modal('show');
                $('#pleaseWaitDialog').removeClass('hide').addClass('show');
                var district = $('.selectpicker').val();
                var options =  {
                        action : 'findToiletByDistrictID',
                        districtID: district
                };
                fetch(options, function (err, collection, response) {
                        if (err) {
                                alert('fetch error');
                        $('#pleaseWaitDialog').removeClass('show').addClass('hide');
                        $('#pleaseWaitDialog').modal('hide');
                        } else {
                        CachedCollection = collection;
                        $('#pleaseWaitDialog').removeClass('show').addClass('hide');
                        $('#pleaseWaitDialog').modal('hide');
                        var view = new ToiletCompositeView({collection: collection});
                        previousView.push('ToiletCompositeView');
				App.layout[configs[module]['region']].show(view);
                        }
                });
        },
        nearList: function (){
                var self = this;
                $('#pleaseWaitDialog').modal('show');
                $('#pleaseWaitDialog').removeClass('hide').addClass('show');
                if(navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(function(position) {
                        var pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                        console.log('pos', pos);
                        var options =  {
                        action : 'findNearToilet',
                        postK: pos.k,
                        postD: pos.D
                        };
                        fetch(options, function (err, collection, response) {
                        if (err) {
                                $('#pleaseWaitDialog').modal('hide');                                
                                $('#pleaseWaitDialog').removeClass('show').addClass('hide');
                                alert('fetch error');
                        } else {
                                CachedCollection = collection;
                                  $('#pleaseWaitDialog').modal('hide');                              
                                $('#pleaseWaitDialog').removeClass('show').addClass('hide');
                                var view = new ToiletCompositeView({collection: collection});
                                previousView.push('ToiletCompositeView');
                                App.layout[configs[module]['region']].show(view);
                        }
                        });
                
                        }, function() {
                                 $('#pleaseWaitDialog').modal('hide');                       
                                $('#pleaseWaitDialog').removeClass('show').addClass('hide');
                                alert('near fail');
                                
                        });
                } else {
                        // Browser doesn't support Geolocation
                        $('#pleaseWaitDialog').removeClass('show').addClass('hide');
                        $('#pleaseWaitDialog').modal('hide');

                        alert("Browser doesn't support Geolocation");
                }
        },
        report: function(){
        var view = new ReportCompositeView({model: new ModuleModel()});
        previousView.push('ReportCompositeView');
        App.layout[configs[module]['region']].show(view);  
        },
        back : function (e){
                      if(previousView.length > 0){
                      console.log($("#back"));
                      previousView.pop();
                        var len = previousView.length - 1;
                        console.log(len, previousView);
                        PreviousView = previousView[len];
                        console.log(PreviousView);
                        if (PreviousView == 'ReportCompositeView'){
                        var view  = new ReportCompositeView({model: new ModuleModel()});
                        }
                        if (PreviousView == 'ToiletSearchView'){
                        var view  = new ToiletSearchView();
                        }
                        if (PreviousView == 'MapView'){
                        var view  = new MapView();
                        }
                        if (PreviousView == 'ToiletDetailView'){
                        var view  = new ToiletDetailView({model: CachedModel});
                        }
                        if (PreviousView == 'ToiletCompositeView'){
                        var view  = new ToiletCompositeView({collection : CachedCollection});
                        } 
                        if (PreviousView == 'MapNearView'){
                        var view  = new MapNearView({collection : CachedCollection});
                        }
                      App.layout[configs[module]['region']].show(view); 
                       }
         },
         Home: function(){
                       var view = new ToiletSearchView();
                        previousView.push('ToiletSearchView');
                        App.layout[configs[module]['region']].show(view); 
        }
        
});

var ReportCompositeView  = Backbone.Marionette.CompositeView.extend({
        template: _.template(tplReportCompositeView),
        onShow: function (){
                $(document).scrollTop(0);
                  $(".selectpicker-report").selectpicker({
                  width: '100%',
                  title: 'chose one of follow'
                  });
                  
        if( /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ) {
        $('.selectpicker-report').selectpicker('mobile');
        }
        $('.selectpicker-report').selectpicker('show');
        },
        events:{
                'click #submit'		: 'submit',
                'click #cancel'		: 'cancel'
        },
        submit: function (e){
        var coordinate = $('#coordinate_0').val();
        var coordinates = coordinate.split(',');
        
                var toilet = {
                name_e : $('#name_e').val(),
                address_e : $('#address_e').val(),
                contact1 : $('#contact1').val(),
                contact2 : $('#contact2').val(),
                fax : $('#fax').val(),
                openHr_e : $('#openHr_e').val(),
                google_coordinate : [Number(coordinates[0]), Number(coordinates[1])],
                districtID : $('.selectpicker-report').val(),
                map_type: 'toilet'
                }
                if(toilet.name_e ==""|| toilet.address_e ==""|| toilet.google_coordinate ==""|| toilet.districtID ==""){
                        alert('please enter infomation');
                } else {
                this.model.save({toilet:toilet}, {
                success: function (model) {
                console.log('saved', model);
                       var view = new ToiletSearchView();
                        previousView.push('ToiletSearchView');
                        App.layout[configs[module]['region']].show(view); 
                },
                error: function (model, err) {
                        alert('save failed');
                }
          });
          
         }
        },
        cancel: function(){
                var view = new ToiletSearchView();
                previousView.push('ToiletSearchView');
                App.layout[configs[module]['region']].show(view); 
        }

});

 var displayToilet = function () {
      var view = new ToiletSearchView();
      console.log('ToiletSearchView');
      console.log(typeof previousView);
        previousView.push('ToiletSearchView');
      App.layout[configs[module]['region']].show(view); 
      var menuView = new MenuView();
      App.layout['menuRegion'].show(menuView); 
};


var resolve = function (alias) {
        displayToilet();
};

var fetch = function (options, callback) {
        options = options || {};
        var deferred = $.Deferred();
        cachedCollection = new ModuleCollection();
        cachedCollection.on("reset", function (data) {
          deferred.resolve(data);  // call deferred.done
        });
       
        var data = {
                action: options.action || 'search'
        };
				
	$.extend(data, options);
        cachedCollection.fetch({
                data: data,
                error: function (﻿collection, response) {
                callback(response.status, ﻿collection, response);
		}	
        });
        
        deferred.done(function () {
          callback(null, cachedCollection);
        });
};



  return Toilet;   
});