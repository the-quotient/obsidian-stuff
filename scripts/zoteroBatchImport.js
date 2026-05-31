module.exports = async (params) => {
    const {app} = params;

    // Adapt these settings
    const LIBRARY_PATH = "zotero/lib.json";
    const STATE_PATH = "zotero/zotero_sync_state.json";
    const IMPORT_FORMAT_NAME = "Import";
    const LIBRARY_ID = 1;
    const DELAY_MS = 1000;

    const zPlugin = app.plugins.getPlugin('obsidian-zotero-desktop-connector');
    if (!zPlugin) { new Notice("Plugin not found!"); return; }

    const abstractFile = app.vault.getAbstractFileByPath(LIBRARY_PATH);
    if (!abstractFile) { new Notice("Library JSON not found!"); return; }

    const content = await app.vault.read(abstractFile);
    let items;
    try {
        items = JSON.parse(content).items;
    } catch (e) { new Notice("JSON Error"); return; }

    let syncState = {};
    const stateFile = app.vault.getAbstractFileByPath(STATE_PATH);
    if (stateFile) {
        try { syncState = JSON.parse(await app.vault.read(stateFile)); } catch(e) {}
    }

    const itemsToImport = items.filter(item => {
        const citekey = item.citationKey;

        if (!citekey) return false;

        const lastMod = item.dateModified || "FORCE_UPDATE";
        if (syncState[citekey] === lastMod) {
            return false;
        }
        return true;
    });

    const skipCount = items.length - itemsToImport.length;

    new Notice(`Found ${items.length} entries.\n- Skipped: ${skipCount}\n- To Import: ${itemsToImport.length}`);

    for (let i = 0; i < itemsToImport.length; i++) {
        const item = itemsToImport[i];
        const citekey = item.citationKey;

        console.log(`[${i + 1}/${itemsToImport.length}] Importing: ${citekey}`);
        new Notice(`[${i + 1}/${itemsToImport.length}] Importing: ${citekey}`);

        try {
            await zPlugin.runImport(IMPORT_FORMAT_NAME, citekey, LIBRARY_ID);
            syncState[citekey] = item.dateModified;
        } catch (e) {
            console.warn(`Direct import failed for ${citekey}. Trying fallback...`, e);
            try {
                const uri = `obsidian://zotero/import?citekey=${citekey}&project=${IMPORT_FORMAT_NAME}`;
                window.location.assign(uri);
                syncState[citekey] = item.dateModified;
            } catch (e2) {
                console.error(`Failed to import ${citekey}`, e2);
            }
        }

        await new Promise(r => setTimeout(r, DELAY_MS));
    }

    try {
        await app.vault.adapter.write(STATE_PATH, JSON.stringify(syncState, null, 2));
        new Notice("Sync complete. State saved.");
    } catch (e) {
        console.error("Failed to save sync state", e);
    }
};
