// @ts-check

const fableUtils = require("fable-utils");
const path = require("path");
const { Asset } = require("parcel-bundler");

// TODO: see if there is a way to clean up these requires
const uglify = require("parcel-bundler/src/transforms/uglify");
const localRequire = require("parcel-bundler/src/utils/localRequire");

const ensureArray = obj => (Array.isArray(obj) ? obj : obj != null ? [obj] : []);

class FableAsset extends Asset {
  constructor(name, pkg, options) {
    super(name, pkg, options);
    this.type = "js";
    this.outputCode = null;
  }

  process() {
    // We don't want to process this asset if the worker is in a warm up phase
    // since the asset will also be processed by the main process, which
    // may cause errors since rust writes to the filesystem.
    if (this.options.isWarmUp) {
      return;
    }

    return super.process();
  }

  async parse(code) {
    const babel = await this.requireDependencies();
    const isProduction = process.env.NODE_ENV === "production";
    const port =
      process.env.FABLE_SERVER_PORT != null
      ? parseInt(process.env.FABLE_SERVER_PORT, 10)
      : 61225;

    let msg = {
      path: this.name,
      define: isProduction ? [] : ["DEBUG"]
    };

    const response = await fableUtils.client.send(port, JSON.stringify(msg))
    const data = JSON.parse(response);

    // ERROR MANAGEMENT
    const { error = null, logs = {} } = data;
    for (const x of ensureArray(logs.warning)) { console.warn(x); }
    for (const x of ensureArray(logs.error)) { console.error(x); }
    if (error || ensureArray(logs.error).length > 0) {
      throw new Error(error || "Compilation error. See log above");
    }

    const babelOpts = fableUtils.resolveBabelOptions({
      // TODO: Does Parcel require commonjs modules?
      plugins: [ "babel-plugin-transform-es2015-modules-commonjs" ]
      // sourceMaps: true,
      // sourceFileName: path.relative(
      //   process.cwd(),
      //   data.fileName.replace(/\\/g, '/')
      // )
    });
    babelOpts.plugins = babelOpts.plugins.concat([
      fableUtils.babelPlugins.getRemoveUnneededNulls(),
      fableUtils.babelPlugins.getTransformMacroExpressions(babel.template)
    ]);

    const transformed = babel.transformFromAst(data, code, babelOpts);
    console.log("fable: Compiled " + path.relative(process.cwd(), msg.path));
    this.contents = transformed.code;

    // add compiled paths as dependencies for watch functionality
    // to trigger rebuild on F# file changes
    this.addDependency(this.name, { includedInParent: true });

    return this.contents;
  }

  // final transformations before bundle is generated
  async transform() {
    if (this.options.minify) {
      await uglify(this);
    }
  }

  async generate() {
    return {
      [this.type]: this.outputCode || this.contents
    };
  }

  generateErrorMessage(error) {
    return (
      path.relative(process.cwd(), this.options.rootDir) +
      path.sep +
      this.relativeName +
      ": " +
      error.message
    );
  }

  // helpers

  async requireDependencies() {
    // TODO: I'm getting an error saying command-exists cannot be found,
    // comment out this part for now

    // dotnet SDK tooling is required by Fable to operate successfully
    // try {
    //   const commandExists = await localRequire("command-exists");
    //   await commandExists("dotnet");
    // } catch (e) {
    //   throw new Error(
    //     "dotnet isn't installed. Visit https://dot.net for more info"
    //   );
    // }

    const babel = await localRequire("babel-core", this.name);
    return babel;
  }

}

module.exports = FableAsset;
