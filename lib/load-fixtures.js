var app, argv, fixtureLoader, optimist, run;

require('coffee-script/register');

optimist = require('optimist');

app = require('../../../server/server');

fixtureLoader = require('./fixtures-loader');

run = function() {
  var append, fixturePath;
  append = argv.append;
  fixturePath = argv.fixturePath;
  if (!append) {
    return fixtureLoader.purgeDatabase(app.models).then(function() {
      console.log('Data purged');
      return fixtureLoader.loadFixtures(app.models, fixturePath);
    }).then(function() {
      console.log('Data successfully loaded');
      return process.exit(0);
    })["catch"](function(err) {
      console.log('Error on fixtures loading:', err);
      return process.exit(1);
    });
  } else {
    return fixtureLoader.loadFixtures(app.models, fixturePath).then(function() {
      console.log('Data successfully loaded');
      return process.exit(0);
    })["catch"](function(err) {
      console.log('Error on fixtures loading:', err);
      return process.exit(1);
    });
  }
};

argv = optimist["default"]({
  append: false,
  fixturePath: '/fixtures/data/'
}).usage('Usage: load-fixtures [options]').alias('h', 'help').alias('h', '?').boolean('h').describe('version', 'Print version info.').alias('i', 'version').boolean('version').describe('append', 'Append data instead of deleting.').alias('a', 'append').boolean('append').describe('fixturePath', 'Fixture path.').alias('f', 'fixturePath').string('fixturePath').argv;

if (argv.version) {
  console.log(module.exports.version);
  process.exit(0);
}

if (argv.help) {
  optimist.showHelp();
  process.exit(1);
}

run();
