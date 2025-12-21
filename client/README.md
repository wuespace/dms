# Client-side code

This directory contains the client-side code for the application. The
application is primarily a server-side application, but it does have some
client-side JavaScript code to handle aspects like the tag input fields.

## Structure

We structure the client-side code as follows:

- `client.ts` - The entry point for the client-side code. This file loads the
  necessary modules and sets up the client-side code.
- `modules/[module].ts` - The client-side code, which we split into modules,
  each of which handles a specific aspect of the client-side code. Each module
  is a separate file in the `modules` directory.

## Build Process

The code gets bundled using ESBuild inside Deno. The build process is defined in
the `../scripts/compile-client.ts` script. The script compiles the client-side
code and writes the output to `/static/dist/client.js` and
`/static/dist/client.css`.

You can run the build process using the following command:

```sh
deno task compile:client
```

You don't need to run the build process manually. The build process is
automatically run (and re-run) within the Docker-based development environment.
