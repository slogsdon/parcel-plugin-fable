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

  async generate() {
    // TODO: is reading the file here required?
    const outputFile = this.name.replace(/\.(fsproj|fsx)$/, '.js');
    const outputContent = await fs.readFile(outputFile);
    return {
      js: outputContent.toString(),
    };
  }

  async parse(code) {
    const fableSplitter = await this.loadDeps();

    // TODO: read from config file and overwrite with the below
    const options = {
      entry: this.name,
      outDir: path.dirname(this.name),
    };

    // TODO: possible without temp file?
    const output = await fableSplitter(options);
    const outputFile = this.name.replace(/\.(fsproj|fsx)$/, '.js');
    const outputContent = await fs.readFile(outputFile);
    this.contents = outputContent.toString();

    return await super.parse(this.contents);
  }

  async loadDeps() {

    await localRequire('babel-core', this.name);
    const fable = await localRequire('fable-splitter', this.name);
    return fable.default;
  }
}

module.exports = FableAsset;
