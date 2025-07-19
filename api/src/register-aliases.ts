// register module aliases for path resolution
const moduleAlias = require('module-alias');

moduleAlias.addAliases({
  '@': __dirname,
  '@util': __dirname + '/util'
});

// This file should be required at the start of the application
