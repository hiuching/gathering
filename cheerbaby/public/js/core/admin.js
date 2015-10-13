/*********************************************
 * Admin module
 *
 * author: Don Lee
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/

;define([
  "marionette",
  "text!tpl/admin.html"
], 

function (Marionette, templateString) {
  
  
/*********************************************
 * Templates
 *********************************************/
    var tplItemView = $('#ItemView', '<div>' + templateString + '</div>').html();
    var tplCompositeView = $('#ListView', '<div>' + templateString + '</div>').html();
    var tplNodeItemView = $('#NodeItemView', '<div>' + templateString + '</div>').html();
    var tplNodeDataItemView = $('#NodeDataItemView', '<div>' + templateString + '</div>').html();
    var tplNodeDataCompositeView = $('#NodeDataCompositeView', '<div>' + templateString + '</div>').html();
    var tplDefaultNodeDataFormView = $('#NodeDataFormView', '<div>' + templateString + '</div>').html();
    var tplNodeDataFormView = tplDefaultNodeDataFormView;

    
/*********************************************
 * Configurations
 *********************************************/
    var module = "admin";
    var configs = {};
    
    var results;
    var searchTerm = "";
    var Revisions, NewRevision, Activity, CurrentRevisionId;
    
    
/*********************************************
 * Main function (export)
 *********************************************/
    var Admin = function () {
      var self = this;
      configs[module] = {
        itemPerRow: 1,
        numOfRow: 5,
        pagePerSection: 10
      };
      $.extend(true, configs, QuestCMS.Config.toJSON());
      pageSize = configs[module]['itemPerRow'] * configs[module]['numOfRow'];
      limit = pageSize * configs[module]['pagePerSection'] + 1;
      //console.log('new Admin');
      
      


      /*********************************************
       * Listening events
       *********************************************/
      QuestCMS.vent.on("pubsub:started", function () {
      });
      
      QuestCMS.vent.on(module + ":add", function () {
        add();
      });
      
      QuestCMS.vent.on(module + ":edit", function (options) {
        edit(options);
      });
      
      QuestCMS.vent.on(module + ":list", function (options) {
        if (QuestCMS.user) {
          if (typeof options.term == 'undefined') {
            options.term = "";
            searchTerm = options.term;
          }
          $.extend(options, {showall: true});
          QuestCMS.vent.trigger("search:adminliststart", options);
        }
      });
      
      QuestCMS.vent.on(module + ":list:finished", function (options) {
        results = options.results;
        display(options);
      });
      
      QuestCMS.vent.on(module + ":resolve", function (alias) {
        resolve(alias);
      });
      
      QuestCMS.vent.on(module + ":display", function (options) {
        display(options);
      });
      
      QuestCMS.vent.on(module + ":newdata", function (options) {
        newdata(options);
      });

    };
    
    
    
/*********************************************
 * Backbone Model
 *********************************************/
    var NodeItem = Backbone.Model.extend({
        initialize: function () { this.options = configs; }, 
        urlRoot: function () { return QuestCMS.Utils.setAPIUrl(this.options) + '/add' ; },
        idAttribute: '_id',
        defaults: function () {
          return {
            "_id": null,
            "_rev": "",
            "dataType": "",
            "data": []
          };
        }
    });

    var NodeDataItem = Backbone.Model.extend({
        idAttribute: 'revision',   
        defaults: {
          "revision": null,
          "isActive": true,
          "alias": "",
          "content": "",
          "creatorId": 0,
          "imgalt": "",
          "imgsrc": "",
          "label": "",
          "language": "",
          "name": "",
          "order": 1,
          "parentId": 0,
          "permission": "",
          "isPublish": true,
          "target": "_self",
          "targetUrl": "",
          "teaser": "",
          "timestamp": "0000-00-00T00:00:00Z",
          "title": ""
        },
        checkLanguage: function () {
            if ((typeof this.get('language') == 'undefined') || (this.get("language") == '')) {
                this.setDefaultLanguage();
            }
            return this;
        },
        isActive: function () {
            var isActive = this.get('isActive');
            if (((typeof isActive != 'undefined') && ( isActive || (isActive.toString() == '1')) ) != 0) {
                this.setActive(true);
                return true;
            } else {
                this.setActive(false);
                return false;
            }
        },
        isCurrent: function () {
            return this.get('isPublish') || false;
        },
        isPublish: function () {
            var isPublish = this.get('isPublish');
            if (((typeof isPublish != 'undefined') && ( isPublish || (isPublish.toString() == '1')) ) != 0) {
                this.setPublish(true);
                return true;
            } else {
                this.setPublish(false);
                return false;
            }
        },
        setActive: function (bool) {
            this.set({isActive: bool}, {silent: true});
            return this;
        },
        setCurrent: function () {
            this.set({isCurrent: this.isCurrent()}, {silent: true});
            return this;
        },
        setDefaultLanguage: function () {
            this.set({language: QuestCMS.Cookie.get("lang")}, {silent: true});
            return this;
        },
        setPublish: function (bool) {
            this.set({isPublish: bool}, {silent: true});
            return this;
        },
        setNow: function () {
            this.set({timestamp: new Date()}, {silent: true});
            return this;
        }
    });

    
 
/*********************************************
 * Backbone Collection
 *********************************************/
    var ModuleCollection = Backbone.Collection.extend({
    });
    

    var NodeDataCollection = Backbone.Collection.extend({
        model: NodeDataItem,
        current: function () {
          return new NodeDataCollection(this.filter(function (data) {
            return (
                (data.isPublish() && data.isActive())
            );
          }));
        }
    });
    
    
/*********************************************
 * Backbone Marionette ItemView
 *********************************************/
    var ModuleItemView = Backbone.Marionette.ItemView.extend({
      template: _.template(tplItemView),
      className: function() {
        return 'adminItem span' + Math.round(12/configs[module].itemPerRow);
      },
      events: {
        'click': 'edit'
      },
      edit: function (e) {
        e.preventDefault();
        var model = this.model.toJSON();
        QuestCMS.vent.trigger(model.dataType + ':edit', {_id: model._id});
      }
    });
    
    
    
    var NodeItemView = Backbone.Marionette.ItemView.extend({
        template: _.template(tplNodeItemView),
        onShow: function () {
          var data = this.model.get("data");
          Revisions = new NodeDataCollection(data);
          showRevisions({model: this.model});
        },
        events: {
          'change .questcms-nodeitem': 'change',
          'click .save': 'save'
        },
        change: function(e) {
          QuestCMS.Utils.hideAlert();
          // Apply the change to the model
          var target = e.target;
          var change = {};
          change[target.name] = target.value;
          this.model.set(change, {silent:true});
          // only change the data form if it is a new item
          if (!this.model.id) {
            QuestCMS.vent.trigger(target.value + ":edit");
          }
        },
        save: function(e) {
          e.preventDefault();
          Backbone.history.navigate('/');
          saveNode({model: this.model});
        }
    });
      
      
    // revision item
    var NodeDataItemView = Backbone.Marionette.CompositeView.extend({
        idAttribute: 'revision',
        tagName: 'li',
        template: _.template(tplNodeDataItemView),
        onBeforeRender: function () {
            this.model.setCurrent();
        },
        events: {
          'click' : 'reload'
        },
        reload: function () {
          var newId = this.model.get("revision");
          if (newId != CurrentRevisionId) {
            QuestCMS.Utils.hideAlert();
            CurrentRevisionId = newId;
            NewRevision = cloneItem(CurrentRevisionId);
            loadInputForm(NewRevision);
          }
        }
    });
      
      
/*********************************************
 * Backbone Marionette CompositeView
 *********************************************/
    var ModuleCompositeView = Backbone.Marionette.CompositeView.extend({
      initialize: function () { 
        this.page = this.options.page;
        this.start = (this.page - 1) * pageSize ;
        this.end = this.page * pageSize;  
      },
      itemView: ModuleItemView,
      template: _.template(tplCompositeView),
      appendHtml: function (collectionView, itemView, index) {
        if ((this.start <= index) && (index < this.end)) {
          collectionView.$(".questcms-searchresults").append(itemView.el);
        }
      },
      onShow: function() {
        this.showPaginator();
        $('#admin-search-term', this.el).html(searchTerm);
        QuestCMS.Utils.setSiteTitle(QuestCMS.l(module));
        $(document).scrollTop(0);
      },
      showPaginator: function () {
        var options = {
            collection: this.collection,
            configs: configs,
            module: module,
            page: this.page,
            target: '.questcms-paginator'
        };
        QuestCMS.vent.trigger("paginator:show", options);
      }
      
    });

    


    // revision list
    var NodeDataCompositeView = Backbone.Marionette.CompositeView.extend({
        itemView: NodeDataItemView,
        template: _.template(tplNodeDataCompositeView),
        appendHtml: function (collectionView, itemView, index) {
          collectionView.$(".questcms-revisions").append(itemView.el);
        },
        events: {
          'click .admin-removeRevision' : 'removeRevision'
        },
        removeRevision: function (e) {
          e.preventDefault();
          Revisions = Revisions.current();
          showRevisions();
        }
    });   

    var NodeDataFormView = Backbone.Marionette.CompositeView.extend({
        initialize: function () {
          this.template = _.template(tplNodeDataFormView);
        },
        onBeforeRender: function () {
          var content = this.model.get('content');
          content = content.replace(/<\/textarea>/g, "&lt;/textarea&gt;");
          this.model.set({content: content});
        },
        onShow: function () {
          $(document).scrollTop(0);
          QuestCMS.Utils.loadTinyMCE({model: this.model}, getTinyMCEContent);
        },
        events: {
          'change' : 'change'
        },
        change: function(e) {
          QuestCMS.Utils.hideAlert();
          var change = QuestCMS.Utils.inputChange({target: e.target});
          this.model.set(change, {silent:true});
          //console.log(this.model.toJSON());
        }
    });
        

        
        
/*********************************************
 * common functions
 *********************************************/
 
    var resolve = function (alias) {
        var action = alias.substr(7);
        if (action == 'logout') {
          QuestCMS.vent.trigger("user:logout");
        } else {
          QuestCMS.Cookie.save({alias: alias, page: 1});
          if (QuestCMS.user) {
            // QuestCMS.vent.trigger("adminmenu:resolve", alias);
            QuestCMS.vent.trigger("administration:resolve", alias);
          } else {
						QuestCMS.vent.trigger("user:displayLoginForm");
          }
        }
    };
  
 
 
 
        
/*********************************************
 * functions
 *********************************************/
    var add = function () {
      Activity = QuestCMS.activity({title: "Add", user: QuestCMS.user});
      var model = new NodeItem();
      var nodeItemView = new NodeItemView({model: model});
      QuestCMS.layout.contentRegion.show(nodeItemView);
      
      Revisions = new NodeDataCollection();
    };
    
    
    var cloneItem = function(id) {
      var lastRevisionNumber = Revisions.at(Revisions.length - 1).get("revision");
      var newRevisionNumber = lastRevisionNumber * 1 + 1;
      var newRevision = Revisions.get(id).clone();
      newRevision.set("revision", newRevisionNumber);
      return newRevision;
    };
    
    
    var display = function (options) {
      options.page = options.page || 1;
      var collection = new ModuleCollection();
      if (!$.isEmptyObject(results)) {
        var r = results.toJSON();
        $.each(r, function (index, model) {
          collection.add(model.collection.toJSON());
        });
      }
      if (collection.length == 0) {
        collection.add({content: QuestCMS.l("Not Found")});
      }
      var view = new ModuleCompositeView({collection: collection, page: options.page});
      QuestCMS.layout.contentRegion.show(view);
    };
    
    
    var edit = function (options) {
      var self = this;
      Activity = QuestCMS.activity({title: "Edit", module: options.module, user: QuestCMS.user});
      
      tplNodeDataFormView = options.templateStr;
      var model = new options.model({_id: options._id});
      model.fetch({
        success: function(model) {
            var nodeItemView = new NodeItemView({model: model});
            QuestCMS.layout.contentRegion.show(nodeItemView);
        },
        error: function () {
          console.log('error');
        }
      });
    };
          
    
    
    var getCurrentId = function() {
      var len = Revisions.length;
      if (len > 0) {
        if (Revisions.current().length > 0) {
          var cur = Revisions.current().at(0);
        } else {
          var cur = Revisions.at(len - 1);
        }
        return cur.get("revision");
      } else {
        return -1;
      }
    };
    
    
    
    var getTinyMCEContent = function (options, change) {
      if (options.model && change) {
        options.model.set(change, {silent: true});
        //console.log(options.model.toJSON());
      }
    };
    
    
    var loadInputForm = function(model) {
      var view = new NodeDataFormView({ model: model });
      var region = new Backbone.Marionette.Region({
        el: '.questcms-editform'
      });
      region.show(view);
    };





    var newdata = function (options) {
        tplNodeDataFormView = options.templateStr;
        NewRevision = new NodeDataItem({revision: 1, creatorId: QuestCMS.user.id, isPublish: true});
        loadInputForm(NewRevision);
    };
    
    
    var saveNode = function (options) {
        options = options || {};
        if (options.model) {
          var model = options.model;

          if (! isModelEmptyDataType(model)) {
            
            // update previous revision isPublish & isActive
            var isPublish = NewRevision.isPublish();
            console.log('new revision', isPublish);
            var isActive = NewRevision.isActive();
            Revisions.each(function(item) {
                if (isPublish) {
                    item.setPublish(!isPublish)
                }
                item.setActive(isActive);
            });
            
            // check language
            NewRevision.checkLanguage().setNow();
            Revisions.add(NewRevision);
            
            Activity.update({change: NewRevision.toJSON()});
            var change = {data: Revisions.toJSON()};
//console.log(change);
            model.set(change, {silent:true}); 
            model.save({}, {
                success: function (model, response, options) {
                  QuestCMS.vent.trigger("routing:resolve", QuestCMS.Cookie.get("alias"));
                  Activity.update({success: true, result: response});
                  Activity.save();
                },
                error: function (model, xhr, options) {
                  QuestCMS.Utils.showAlert('Error', 'An error occurred while trying to save this item');
                  Activity.update({success: false, result: xhr});
                  Activity.save();
                }
            });
          } else {
            QuestCMS.Utils.showAlert('Error', 'Data Type could not be empty');
          }
            
            
        }
    };
    
  
    var showRevisions = function (options) {
    
        // var data = options.model.get("data");
        // Revisions = new NodeDataCollection(data);
        
        var view = new NodeDataCompositeView({ collection: Revisions });
        //$('.questcms-revisionList').show(view);  
        $('.questcms-revisionList').html(view.render().el);  
        
        CurrentRevisionId = getCurrentId();
        if (CurrentRevisionId != -1) {
          NewRevision = cloneItem(CurrentRevisionId);
        } else {
          NewRevision = options.model;
        }
        loadInputForm(NewRevision);
    };
  
  
    var getModelDataType = function (model) {
          if (typeof model.get('dataType') === 'undefined') {
            model.set({dataType: ''}, {silent: true});
          }
          return model.get('dataType') || "";
    };
    
    var isModelEmptyDataType = function (model) {
          if (getModelDataType(model) == '') {
            return true;
          } else {
            return false;
          }
    };
  
  
/*********************************************
 * Return
 *********************************************/
    return Admin;


});