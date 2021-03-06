var config = require('../lib/config');
var join = require('path').join;

describe('config', function() {

  it('normal', function() {
    var cwd = join(__dirname, 'fixtures/config');
    var args = config.get(cwd);

    // custom
    args.registry.should.be.equal('1');
    args.autoprefixer.should.be.true;
    // default
    (args.pathmap === null).should.be.true;

    // deep merge
    // args.cssminOpts.noAdvanced.should.be.true;
    args.coffeeOpts.bare.should.be.false;
  });

  it('dont pass cwd', function() {
    var cwd = join(__dirname, 'fixtures/config');
    process.chdir(cwd);
    var args = config.get();

    // custom
    args.registry.should.be.equal('1');
    // default
    (args.pathmap === null).should.be.true;
  });
});
