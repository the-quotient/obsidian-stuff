(async () => {
    const { vault, workspace } = app;
    const file = workspace.getActiveFile();
    const content = await vault.read(file);

    const updatedContent = content.replace(
        /(filter by function )(!)?task\.file\.tags\.includes\(\"#work\"\)/,
                                           (_, prefix, hasExclamation) => {
                                               return hasExclamation
                                               ? `${prefix}task.file.tags.includes("#work")`
                                               : `${prefix}!task.file.tags.includes("#work")`;
                                           }
    );

    await vault.modify(file, updatedContent);
})();
