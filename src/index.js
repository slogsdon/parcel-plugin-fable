module.exports = function(bundler) {
  bundler.addAssetType("fsproj", require.resolve("./fable-asset"));
  bundler.addAssetType("fs", require.resolve("./fable-asset"));
  bundler.addAssetType("fsx", require.resolve("./fable-asset"));
};
