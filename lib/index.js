var fixtureLoader, merge;

fixtureLoader = require('./fixtures-loader');

merge = require('merge');

module.exports = function(app, options) {
  var loadFixtures;
  options = merge({
    fixturePath: '/fixtures/data/',
    append: false,
    autoLoad: false
  }, options);
  loadFixtures = function() {
    if (!options.append) {
      return fixtureLoader.purgeDatabase(app.models).then(function() {
        console.log('Data purged');
        return fixtureLoader.loadFixtures(app.models, options.fixturePath);
      });
    } else {
      return fixtureLoader.loadFixtures(app.models, options.fixturePath);
    }
  };
  if (options.autoLoad) {
    loadFixtures();
  }
  return app.loadFixtures = function() {
    return loadFixtures();
  };
};
