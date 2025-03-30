'use strict';

let obsidian = require('obsidian');
let DEFAULT_SETTINGS = {
	'keyboard_shortcuts': []
};

class HighlightOpenFiles extends obsidian.Plugin {
    async onload() {
		// await this.loadSettings();
		const workspace = this.app.workspace;
		const highlight_open_files = obsidian.debounce( () => {
			const file_explorer = workspace.getLeavesOfType('file-explorer')[0];
			const file_explorer_tree = file_explorer.view.tree;
			const get_file_explorer_file_items = () => { return file_explorer_tree.view.fileItems }
			const get_open_files = () => { 
				let open_items = [];
				workspace.iterateRootLeaves( leaf => { leaf.loadIfDeferred(); open_items.push(leaf.view.file) } );
				return open_items;
			};
			let file_explorer_file_items = get_file_explorer_file_items();
			let open_items = get_open_files();
			for (let value in file_explorer_file_items ) {
			if ( open_items.includes(file_explorer_file_items[value].file) ) {
					file_explorer_file_items[value].innerEl.classList.add('highlight_open_file')
				} else {
					file_explorer_file_items[value].innerEl.classList.remove('highlight_open_file');
				}
			}
		},1000);
		workspace.onLayoutReady( async () => { sleep(0).then( () => { highlight_open_files(); }); });																// initialize
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => {
				highlight_open_files()
			})
		);
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
