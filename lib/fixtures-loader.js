var Promise, YAML, _, faker, fs, idKey, path;

_ = require('lodash');

faker = require('faker');

fs = require('fs');

path = require('path');

Promise = require('bluebird');

YAML = require('yamljs');

idKey = 'id';

module.exports = {
  savedData: {},
  loadFixtures: function(models, fixturesPath) {
    var fixtureFolderContents, fixturePath, fixtures, loadingFixturesPromises;
    fixturePath = path.join(process.cwd(), fixturesPath);
    fixtureFolderContents = fs.readdirSync(fixturePath);
    fixtures = fixtureFolderContents.filter(function(fileName) {
      return fileName.match(/\.yml$/);
    });
    loadingFixturesPromises = [];
    _.each(fixtures, (function(_this) {
      return function(fixture) {
        var fixtureData;
        fixtureData = YAML.load(fixturePath + fixture);
        return loadingFixturesPromises.push(_this.loadYamlFixture(models, fixtureData));
      };
    })(this));
    return Promise.all(loadingFixturesPromises);
  },
  purgeDatabase: function(models) {
    var purgeModelPromises;
    purgeModelPromises = [];
    _.forEach(models, (function(_this) {
      return function(model) {
        return purgeModelPromises.push(_this.purgeModel(model));
      };
    })(this));
    return Promise.all(purgeModelPromises);
  },
  purgeModel: function(model) {
    return new Promise(function(resolve, reject) {
      return model.destroyAll(function(err) {
        if (err) {
          reject(err);
        }
        return resolve();
      });
    });
  },
  getRandomMatchingObject: function(pattern) {
    var objects, regex;
    regex = new RegExp(pattern);
    objects = _.filter(this.savedData, function(value, key) {
      return !_.isEmpty(key.match(regex));
    });
    return _.sample(objects);
  },
  replaceReferenceInObjects: function(object) {
    return new Promise((function(_this) {
      return function(resolve, reject) {
        _.each(object, function(value, key) {
          var identifier, ref, referencedObject;
          if (((ref = _.values(value)) != null ? ref[0] : void 0) === '@') {
            identifier = value.substring(1);
            referencedObject = _this.getRandomMatchingObject("^" + identifier + "$");
            if (referencedObject != null ? referencedObject[idKey] : void 0) {
              return object[key] = referencedObject[idKey];
            } else {
              return reject('[ERROR] Please provide object for @' + identifier);
            }
          }
        });
        return resolve(object);
      };
    })(this));
  },
  executeGenerators: function(data) {
    var expandedData;
    expandedData = {};
    _.each(data, function(object, identifier) {
      var i, j, match, max, min, ref, ref1, regex, results;
      regex = /(\w+)\{(\d+)..(\d+)\}$/;
      match = identifier.match(regex);
      if ((match != null ? match.length : void 0) === 4) {
        identifier = match[1];
        min = parseInt(match[2]);
        max = parseInt(match[3]);
        results = [];
        for (i = j = ref = min, ref1 = max; ref <= ref1 ? j <= ref1 : j >= ref1; i = ref <= ref1 ? ++j : --j) {
          expandedData[identifier + i] = _.clone(object);
          results.push(_.each(object, function(value, key) {
            var newValue;
            if (typeof value === 'string') {
              newValue = value.replace('{@}', i.toString());
            } else {
              newValue = value;
            }
            return expandedData[identifier + i][key] = newValue;
          }));
        }
        return results;
      } else {
        return expandedData[identifier] = object;
      }
    });
    return expandedData;
  },
  executeFaker: function(data) {
    _.each(data, function(object, identifier) {
      return _.each(object, function(value, key) {
        var e;
        try {
          return data[identifier][key] = faker.fake(value);
        } catch (error) {
          e = error;
          return data[identifier][key] = value;
        }
      });
    });
    return data;
  },
  executeFunctions: function(data) {
    _.each(data, function(object, identifier) {
      return _.each(object, function(value, key) {
        var e, fn;
        try {
          fn = eval(value);
          return data[identifier][key] = fn;
        } catch (error) {
          e = error;
        }
      });
    });
    return data;
  },
  applyHelpers: function(data) {
    var expandedData;
    expandedData = this.executeGenerators(data);
    expandedData = this.executeFaker(expandedData);
    expandedData = this.executeFunctions(expandedData);
    return expandedData;
  },
  loadYamlFixture: function(models, fixtureData) {
    fixtureData = _.map(fixtureData, function(data, index) {
      return {
        fixtures: data,
        name: index
      };
    });
    return Promise.each(fixtureData, (function(_this) {
      return function(modelData) {
        var modelFixtures;
        modelData.fixtures = _this.applyHelpers(modelData.fixtures);
        modelFixtures = _.map(modelData.fixtures, function(data, index) {
          return {
            object: data,
            identifier: index
          };
        });
        return Promise.each(modelFixtures, function(fixture) {
          return _this.replaceReferenceInObjects(fixture.object).then(function(object) {
            return models[modelData.name].create(object);
          }).then(function(savedObject) {
            _this.savedData[fixture.identifier] = savedObject;
            return console.log(("[" + modelData.name + "] - " + fixture.identifier + " ") + ("imported (id : " + (savedObject != null ? savedObject[idKey] : void 0) + ")"));
          });
        });
      };
    })(this));
  }
};
