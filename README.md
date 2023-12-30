# arbn-floorplan-canvas
A drawing engine to draw paths and shapes and get their coordinates and other related information. The original scope of this tool is to help with the creation of floorplan and save it in a form of a json format.

## Getting started
To start the demo for testing all the functionalities of the library, just run the script `npm run start` which will run
webpack dev-server.
Alternatively, you can build and run manually all the packages using `npm run build`.

## Release
Build a production configuration with `npm run prod`. The bundle js should be located in the folder `dist/arbn-floorplan-canvas`.

## Publish the library
The library can be published via the Github Package Registry.

* `npm --no-git-tag-version version patch | minor | major` to release a new version;
  * Use `patch` for minor changes/bugfixes which are backwards compatible
  * Use `minor` for adding new components which are backwards compatible
  * Use `major` for breaking changes which break backwards compatibility
* Build the library in production mode;
  * e.g. `npm run prod`
* `npm pack`;
* `npm publish`;

> Remember to make sure your personal access token has the correct permissions (repo, write:packages, read:packages).
