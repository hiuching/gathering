var createdModifiedPlugin = function (schema, options) {
  schema.add({ 
    created: {
      type: Date,
      'default': Date.now
    },
    modified: {
      type: Date,
      'default': Date.now
    } 
  });

  schema.pre('save', function (next) {
    this.modified = new Date;
    next();
  })

  if (options && options.index) {
    schema.path('created').index(options.index);
    schema.path('modified').index(options.index);
  }
}

module.exports = createdModifiedPlugin;