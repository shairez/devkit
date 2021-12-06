import { startAngularDevServer } from '@jscutlery/cypress-angular-dev-server';
import { preprocessTypescript } from '@nrwl/cypress/plugins/preprocessor';

module.exports = (on, config) => {
  on('dev-server:start', (options) =>
    startAngularDevServer({ config, options })
  );
  /* @hack using deprecated preprocessTypescript
   * as there is something wrong with the default Cypress config
   * that produces the following error when using things like @jscutlery/harness
   * that imports @angular/cdk/testing:
   *     Error: Webpack Compilation Error
   *     /jscutlery/devkit/node_modules/@angular/cdk/fesm2015/testing/testbed.mjs
   *     Module not found: Error: Can't resolve '@angular/cdk/keycodes'
   *     in '/jscutlery/devkit/node_modules/@angular/cdk/fesm2015/testing' */
  on('file:preprocessor', preprocessTypescript(config));
  return config;
};
