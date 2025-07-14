
(async () => {
  const { vault, workspace } = this.app;
  const file = workspace.getActiveFile();
  let text = await vault.read(file);

  // Split into lines so we can splice in/out cleanly
  const lines = text.split(/\r?\n/);

  // 1) Find start of "## Tasks"
  const startIdx = lines.findIndex(l => /^##\s*Tasks\b/i.test(l));
  if (startIdx === -1) return;

  // 2) Find where the next "## " header is (or end of file)
  let endIdx = lines
    .slice(startIdx + 1)
    .findIndex(l => /^##\s+/.test(l));
  endIdx = endIdx === -1 ? lines.length : startIdx + 1 + endIdx;

  // 3) Extract just that slice (everything *inside* the Tasks section)
  const section = lines.slice(startIdx + 1, endIdx);

  // 4) Pull out all checkbox lines
  const taskPattern = /^\s*-\s*\[[ xX]\]\s*/;
  const allTasks = section.filter(line => taskPattern.test(line));

  // 5) Split case-sensitively on "TODO" immediately after the box:
  const todoRe     = /^\s*-\s*\[[ xX]\]\s*TODO\b/;
  const todoLines  = allTasks.filter(l => todoRe.test(l));
  const quickLines = allTasks.filter(l => !todoRe.test(l));

  // 6) Sort each so checked items ([x] or [X]) float to the top
  const sortDoneFirst = arr =>
    arr.sort((a, b) =>
      (/\[x\]/.test(b) ? 1 : 0) - (/\[x\]/.test(a) ? 1 : 0)
    );
  sortDoneFirst(quickLines);
  sortDoneFirst(todoLines);

  // 7) Build a brand-new section (no leftover headers, no dupes)
  const rebuilt = [];
  rebuilt.push(lines[startIdx]); // "## Tasks" header
  rebuilt.push("");              // blank line

  if (quickLines.length) {
    rebuilt.push("### Quick Capture");
    rebuilt.push(...quickLines);
    rebuilt.push("");
  }
  if (todoLines.length) {
    rebuilt.push("### TODO to be processed");
    rebuilt.push(...todoLines);
    rebuilt.push("");
  }

  // 8) Splice it back into the full file
  const newLines = [
    ...lines.slice(0, startIdx),
    ...rebuilt,
    ...lines.slice(endIdx),
  ];
  const newText = newLines.join("\n");

  await vault.modify(file, newText);
})();

