(async () => {
  const { vault, workspace } = app;
  const file = workspace.getActiveFile();

  const content = await vault.read(file);
  const lines = content.split("\n");

  const tasksToMove = [];
  const newLines = [];

  let inCode = false;
  let inFrontmatter = false;
  let frontmatterEnded = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle frontmatter
    if (!frontmatterEnded && line.trim() === "---") {
      inFrontmatter = !inFrontmatter;
      if (!inFrontmatter) frontmatterEnded = true;
      newLines.push(line);
      continue;
    }

    if (inFrontmatter) {
      newLines.push(line);
      continue;
    }

    // Handle code blocks
    if (line.trim().startsWith("```")) {
      inCode = !inCode;
      newLines.push(line);
      continue;
    }

    if (!inCode) {
      const isChecked = /^\s*-\s*\[[xX]\]\s/.test(line);
      const isUnchecked = /^\s*-\s*\[\s\]\s/.test(line);
      const isPlainList = /^\s*-\s+\S+/.test(line);
      const hasTODO = line.includes("TODO");

      // Move unchecked tasks and plain list items (not TODO)
      if (
        ((isUnchecked && !hasTODO) || (isPlainList && !isUnchecked)) &&
        !isChecked
      ) {
        tasksToMove.push(line);
        continue;
      }
    }

    newLines.push(line);
  }


  // Use window.moment
  const today = window.moment().format("YYYY-MM-DD");
  const dailyPath = `daily/${today}.md`;
  const dailyFile = vault.getAbstractFileByPath(dailyPath);


  const movedTasks = tasksToMove.filter(line => /^\s*-\s*\[\s\]\s/.test(line));
  const movedPlain = tasksToMove.filter(line => !/^\s*-\s*\[\s\]\s/.test(line));

  const joinedContent = [
    ...movedTasks,
    "",
    "",
    ...movedPlain
  ].join("\n");

  await vault.append(dailyFile, joinedContent);
  await vault.modify(file, newLines.join("\n"));

})();

