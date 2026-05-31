(async () => {
    const { vault, workspace } = app;
    const file = workspace.getActiveFile();
    const content = await vault.read(file);

    const updatedContent = content.replace(
        /^(\s*)(#\s*)?(group by priority)\s*$/gm,
                                           (match, indent, comment, line) =>
                                           comment ? `${indent}${line}` : `${indent}# ${line}`
    );

    await vault.modify(file, updatedContent);
})();
