(async () => {
  const { vault, workspace, Notice } = app;
  const file = workspace.getActiveFile();

  const content = await vault.read(file);
  const lines = content.split("\n");

  const taskBlocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const topLevelMatch = /^\s*-\s*\[[ xX]\]\s/.test(line);

    if (topLevelMatch) {
      const parentIndent = line.match(/^\s*/)[0].length;
      const block = { parent: line, children: [] };
      i++;

      // Collect all more-indented lines as children
      while (i < lines.length) {
        const next = lines[i];
        const nextIndent = next.match(/^\s*/)[0].length;
        if (/^\s*-\s*\[[ xX]\]\s/.test(next) && nextIndent <= parentIndent) {
          break; // new top-level task
        }
        if (/^\s*-\s*\[[ xX]\]\s/.test(next)) {
          block.children.push(next);
        }
        i++;
      }

      taskBlocks.push(block);
    } else {
      i++;
    }
  }

  const localBlocks = [];
  const toMoveBlocks = [];

  for (const block of taskBlocks) {
    if (block.parent.includes("TODO")) {
      const match = block.parent.match(/--→\s*([^\s]+)\s*TODO/);
      if (match) {
        toMoveBlocks.push({ ...block, target: match[1] });
      }
    } else {
      localBlocks.push(block);
    }
  }

// Sort subtasks inside each local block
  for (const block of localBlocks) {
    const checked = [];
    const unchecked = [];
    for (const child of block.children) {
      if (/\[x\]/i.test(child)) checked.push(child);
      else unchecked.push(child);
    }
    checked.sort();
    unchecked.sort();
    block.children = [...checked, ...unchecked];
  }

  // Sort top-level blocks: checked tasks first, then unchecked, both alphabetically
  localBlocks.sort((a, b) => {
    const aChecked = /\[x\]/i.test(a.parent);
    const bChecked = /\[x\]/i.test(b.parent);
    if (aChecked !== bChecked) {
      return aChecked ? -1 : 1;
    }
    return a.parent.localeCompare(b.parent);
  });

  // Build final content
  const beforeTasks = [];
  const afterTasksStart = taskBlocks.length
    ? lines.findIndex(line => line === taskBlocks[0].parent)
    : lines.length;

  for (let j = 0; j < afterTasksStart; j++) {
    beforeTasks.push(lines[j]);
  }

  const sortedTaskLines = localBlocks.flatMap(block =>
    [block.parent, ...block.children]
  );

  const finalLines = [...beforeTasks, ...sortedTaskLines];

  await vault.modify(file, finalLines.join("\n"));

  for (const { parent, children, target } of toMoveBlocks) {
    const tfile = vault
      .getFiles()
      .find(f => f.basename.toLowerCase() === target.toLowerCase());

    if (tfile) {
      const cleanedParent = parent.replace(/--→\s*[^\s]+\s*/, "");
      const blockLines = [cleanedParent, ...children];
      const tContent = await vault.read(tfile);
      await vault.modify(tfile, tContent + "\n" + blockLines.join("\n"));
    }
  }

})();
