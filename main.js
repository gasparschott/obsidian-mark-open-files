'use strict';

let obsidian = require('obsidian');
let DEFAULT_SETTINGS = {
	'keyboard_shortcuts': []
};

class HighlightOpenFiles extends obsidian.Plugin {
    async onload() {
		// await this.loadSettings();
		const workspace = this.app.workspace;
		const highlight_open_files = () => {
			const file_explorer = workspace.getLeavesOfType('file-explorer')[0];
			const file_explorer_tree = file_explorer.view.tree;
			const get_file_explorer_file_items = () => { return file_explorer_tree.view.fileItems }
			const get_open_files = () => { 
				let open_files = [];
				workspace.iterateAllLeaves( leaf => { open_files.push(leaf.view.file)} );
				return open_files;
			};
			const open_files = get_open_files();
			let file_explorer_file_items = get_file_explorer_file_items();
			for (let value in file_explorer_file_items ) {
			if ( open_files.includes(file_explorer_file_items[value].file) ) {
					file_explorer_file_items[value].innerEl.classList.add('highlight_open_file')
				} else {
					file_explorer_file_items[value].innerEl.classList.remove('highlight_open_file');
				}
			}
		}
		workspace.onLayoutReady( async () => { sleep(750).then( () => { highlight_open_files(); }); });																// initialize
		this.registerEvent(
			this.app.workspace.on('layout-change', () => {
				highlight_open_files()
			})
		);
	} 
    // end onload
    // on plugin unload
	onunload() {
		this.app.workspace.getLeavesOfType('file-explorer')[0].view.tree.containerEl.querySelectorAll('.highlight_open_file').forEach( el => el.classList.remove('highlight_open_file') );
    }
	// load settings
    async loadSettings() {
		// this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }
    // save settings
    async saveSettings() {
		// await this.saveData(this.settings);
    }
}
module.exports = HighlightOpenFiles;
