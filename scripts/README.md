# Scripts

We use scripts to automate development tasks. We write Scripts in TypeScript
(running in Deno) and they have a corresponding task in the `deno.json` file
that you can run with:

```sh
deno task [task-name]
```

Tasks that are necessary for the development environment, such as downloading
dependencies and compiling static assets get handled automatically by the
Docker-based development environment.
