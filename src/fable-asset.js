const commandExists = require('command-exists');
const path = require('path');
const {Asset} = require('parcel-bundler');
// TODO: see if there is a way to clean up these requires
const fs = require('parcel-bundler/src/utils/fs');
const localRequire = require('parcel-bundler/src/utils/localRequire');

class FableAsset extends Asset {
  constructor(name, pkg, options) {
    super(name, pkg, options);
    this.type = 'js';
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
    const fableSplitter = await this.loadDeps();
    let options = {
      entry: this.name,
      outDir: path.dirname(this.name),
    };

    // read project config and use that as the base
    const config = await this.getConfig(['fable-splitter.config.js']);
    if (config) {
      options = Object.assign(config, options);
    }

    const info = await fableSplitter(options);

    // add compiled paths as dependencies for watch functionality
    // to trigger rebuild on F# file changes
    Array
      .from(info.compiledPaths)
      .map(p => this.addDependency(p, {includedInParent: true}));

    // TODO: possible without temp file?
    const outputFile = this.name.replace(/\.(fsproj|fsx)$/, '.js');
    const outputContent = await fs.readFile(outputFile);
    this.contents = outputContent.toString();

    // `this.contents` becomes the new value for `this.ast`
    return this.contents;
  }

  async loadDeps() {
    // dotnet SDK tooling is required by Fable to operate successfully
    try {
      await commandExists('dotnet');
    } catch (e) {
      throw new Error(
        "dotnet isn't installed. Visit https://dot.net for more info"
      );
    }

    await localRequire('babel-core', this.name);
    const fable = await localRequire('fable-splitter', this.name);
    return fable.default;
  }
}

module.exports = FableAsset;
