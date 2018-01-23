# parcel-plugin-fable

> Parcel asset type plugin for Fable

Featuring:

* [F#](http://fsharp.org/) + [Fable](http://fable.io/)
* [Parcel](https://parceljs.org/)

### Reasoning

This project was primarily created to combine some new and old technologies in order to see what a more complete project could look like and how the individual parts would work together. Specifics:

* F#: strong, static typing + .NET ecosystem
* Fable: generated JavaScript code from F# sources
* Parcel: frontend asset bundling with minimal configuration

## Requirements

* [Node.js](https://nodejs.org/)
* [Yarn](https://yarnpkg.com/docs/install/) or [npm](https://docs.npmjs.com/getting-started/installing-node)
* [`dotnet` SDK](https://www.microsoft.com/net/download)

## Getting Started

```
yarn add parcel-plugin-fable
```

Parcel will automatically include any dependencies listed in `package.json` that start with `parcel-plugin-`, so there is no additional configuration. On first build of a `.fsproj` or `.fsx` file, `fable-splitter` and `babel-core` will be added as dependencies and are responsible for transpiling to JavaScript.

See [the example](example) for a complete project.

## LICENSE

This project is licensed under the MIT License. See [LICENSE](LICENSE) for more details.
