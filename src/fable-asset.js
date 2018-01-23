const path = require('path');
// TODO: see if there is a way to clean up these requires
const JSAsset = require('parcel-bundler/src/assets/JSAsset');
const fs = require('parcel-bundler/src/utils/fs');
const localRequire = require('parcel-bundler/src/utils/localRequire');

class FableAsset extends JSAsset {
  async parse(code) {
    await localRequire('babel-core', this.name);
    const fable = await localRequire('fable-splitter', this.name);

    // TODO: read from config file and overwrite with the below
    const options = {
      entry: this.name,
      outDir: path.dirname(this.name),
    };

    // TODO: possible without temp file?
    const output = await fable.default(options);
    const outputFile = this.name.replace(/\.(fsproj|fsx)$/, '.js');
    const outputContent = await fs.readFile(outputFile);
    this.contents = outputContent.toString();

    return await super.parse(this.contents);
  }
}

module.exports = FableAsset;
