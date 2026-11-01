export default function CliDocs() {
  return (
    <div>
      <h1 className="font-display text-3xl">CLI (as specced)</h1>
      <div className="mt-4 flex flex-col gap-3 text-sm leading-relaxed">
        <p>
          The Arche CLI ships in Brief #4. Until then, every install path uses the stock shadcn CLI
          (see Install an identity). The specced surface it will wrap:
        </p>
        <pre className="overflow-x-auto rounded-md border border-border bg-card p-3 text-xs">{`arche login                 # sign in (browser flow)
arche logout                # remove the local token
arche whoami                # signed-in account
arche init <user>/<library> # wire this project to a library
arche add <component>       # install one component
arche install               # install the whole library
arche list                  # wired library's components
arche check                 # standards check over this project`}</pre>
        <p>Commands and their meaning survive the v1→v2 engine swap unchanged.</p>
      </div>
    </div>
  );
}
