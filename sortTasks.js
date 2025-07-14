(async () => {
  const { vault, workspace } = this.app;
  const debug = this.input?.debug ?? false;
  if (debug) console.log("🔍 sortTasks.js starting…", { debug });

  const file = workspace.getActiveFile();
  if (!file) {
    if (debug) console.warn("No active file—aborting.");
    return;
  }
  if (debug) console.log("Active file:", file.path);

  const text = await vault.read(file);
  // grab the ## tasks header + body
  const regex = /(##\s*tasks.*\r?\n)([\s\S]*?)(?=\n##|\n$)/im;
  const m = text.match(regex);
  if (!m) {
    if (debug) console.warn("No ## tasks section found.");
    return;
  }
  const [, header, body] = m;
  if (debug) console.log("Section header:", header.trim());

  // extract only task lines
  const lines = body
    .split(/\r?\n/)
    .filter(l => /^\s*-\s*\[[ xX]\]\s*/.test(l));
  if (!lines.length) {
    if (debug) console.log("No task lines under ## tasks.");
    return;
  }
  if (debug) console.log(`Found tasks: ${lines.length}`);

  // partition into TODO vs normal
  const todo = lines.filter(l => l.includes("TODO"));
  const normal = lines.filter(l => !l.includes("TODO"));
  if (debug) {
    console.log(
      "Normal count:", normal.length,
      "TODO count:", todo.length
    );
  }

  // rebuild the section with two ### subheadings
  let newSection = header;
  if (normal.length) {
    newSection += "### Quick Capture\n"
               + normal.join("\n")
               + "\n\n";
  }
  if (todo.length) {
    newSection += "### TODO to be processed\n"
               + todo.join("\n")
               + "\n";
  }

  const newText = text.replace(regex, newSection);
  await vault.modify(file, newText);
  if (debug) console.log("✅ sortTasks.js complete.");
})();

