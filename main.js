'use strict';

let obsidian = require('obsidian');
let DEFAULT_SETTINGS = {
	'marker_position': 		'after'
}
const awaitFileExplorer = (workspace) => {
	return new Promise( (resolve) => {
		resolve(workspace.getLeavesOfType('file-explorer')[0]);
	})
}
const addMarker = (el,leaf_id,position) => {
	let tree_item = el.closest('.tree-item.nav-file');
		tree_item.classList.add('has_open_file_marker');
	let marker_container = document.createElement('div');
		marker_container.classList.add('mark_open_files_container');
		marker_container.classList.add('marker_position_'+position);
	let marker = document.createElement('span');
		marker.classList.add('mark_open_files');
		marker.dataset.leaf_id = leaf_id;
		marker.textContent = '•';
	if ( !tree_item.querySelector('.mark_open_files_container') ) {
		el.insertAdjacentElement('afterbegin',marker_container);												// add marker container if needed
	}
	tree_item.querySelector('.mark_open_files_container').insertAdjacentElement('beforeend',marker);			// find marker container and insert marker
}
const markOpenFiles = (workspace,position,bool) => {
	if ( workspace.app.internalPlugins.getPluginById('file-explorer').enabled === false ) { return; }
	awaitFileExplorer(workspace).then( () => {
		const file_explorer_tree = workspace.getLeavesOfType('file-explorer')[0].view.tree;
		const getOpenItems = () => { 
			let open_leaves = [], open_leaves_ids = [];
			workspace.iterateRootLeaves( leaf => { leaf.loadIfDeferred(); open_leaves.push(leaf); open_leaves_ids.push(leaf.id); } );
			return [open_leaves,open_leaves_ids];
		};
		let open_items = getOpenItems(), open_leaves = open_items[0], open_leaves_ids = open_items[1], open_leaves_paths = open_items[2];
		let getMarkers = () => { return file_explorer_tree?.containerEl?.querySelectorAll('.mark_open_files') };									// get marked file explorer items
		let markers = getMarkers();
		if ( !markers ) { return }
		if ( bool === true ) { markers.forEach( marker => marker.closest('.mark_open_files_container').remove() ) }									// remove markers if position changed in settings
		open_leaves.forEach( open_leaf => {
			let tree_item_self = file_explorer_tree?.containerEl?.querySelector('.tree-item-self[data-path="'+open_leaf?.view?.file?.path+'"]') || null;	// find tree item by leaf file path
			if ( tree_item_self !== null && !tree_item_self.querySelector('.mark_open_files[data-leaf_id="'+open_leaf.id+'"]') ) {
				addMarker(tree_item_self,open_leaf.id,position );				// if no matching leaf marker, add leaf marker
			}
		});
		getMarkers().forEach( marker => {
			if ( !open_leaves_ids.includes(marker.dataset.leaf_id) 																		// if no open leaf id matches the marker id
			|| workspace.getLeafById(marker?.dataset?.leaf_id).view.file.path !== marker.closest('.tree-item-self')?.dataset?.path ) { 	// reused leaves keep the same id, so check path instead
				if ( marker.closest('.mark_open_files_container').querySelectorAll('.mark_open_files').length === 1 ) {					// cleanup
					marker.closest('.has_open_file_marker').classList.remove('has_open_file_marker');
					marker.closest('.mark_open_files_container').remove();
				} else {
					marker.remove();																									// remove the marker
				}
			}
		});
	});
}
class MarkOpenFiles extends obsidian.Plugin {
    async onload() {
		await this.loadSettings();
		this.addSettingTab(new MarkOpenFilesSettings(this.app, this));
		const getPosition = () => { return this.settings.marker_position; }
		const workspace = this.app.workspace;
		workspace.onLayoutReady( () => { sleep(100).then( () => { 
			if ( workspace.app.internalPlugins.getPluginById('file-explorer').enabled === false ) { alert('The plugin “Mark Open Files” requires the core “Files” plugin to be enabled.'); }
			markOpenFiles(workspace,getPosition()); }); 
		});												// initialize
		this.registerDomEvent(document,'mousedown', (e) => {
			if ( /mark_open_files/.test(e.target.className) ) {
				e.stopPropagation(); e.stopImmediatePropagation; e.preventDefault();
				e.target.addEventListener('mouseup', function(e) { 
					e.stopPropagation(); e.stopImmediatePropagation(); e.preventDefault();
				});
				e.target.addEventListener('click', function(e) { 
					e.stopPropagation(); e.stopImmediatePropagation(); e.preventDefault();
					workspace.setActiveLeaf(workspace.getLeafById(e.srcElement.dataset.leaf_id),{focus:true});
					workspace.getLeafById(e.srcElement.dataset.leaf_id).tabHeaderEl.click();												// trigger Continuous Mode plugin scroll into view
				});
			}
		});
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => {
				markOpenFiles(workspace,getPosition());
			})
		);
		this.registerEvent(
			this.app.workspace.on('layout-change', () => {
				markOpenFiles(workspace,getPosition());
			})
		);
	} 
    // end onload
    // on plugin unload
	onunload() {
		this.app.workspace.getLeavesOfType('file-explorer')[0].view.tree.containerEl.querySelectorAll('.mark_open_files_container').forEach( 
			el => { el.closest('.has_open_file_marker')?.classList?.remove('has_open_file_marker'); el.remove(); } 													// remove marker elements
		);
    }
	// load settings
    async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }
	// save settings
    async saveSettings() {
		await this.saveData(this.settings);
    }
}
let MarkOpenFilesSettings = class extends obsidian.PluginSettingTab {
	constructor(app, plugin) {
		super(app, plugin);
		this.plugin = plugin;
	}
	display() {
		const { containerEl } = this;
		containerEl.empty();
        containerEl.createEl("h1", {}, (el) => {el.innerHTML = 'Mark Open Files'; });
		new obsidian.Setting(containerEl).setName('Marker position').setDesc('Choose where to the marker should appear.')
			.addDropdown((dropDown) => {
				dropDown.addOption("left", "Align left");
				dropDown.addOption("before", "Before name");
				dropDown.addOption("after", "After name");
				dropDown.addOption("right", "Align right");
				dropDown.setValue( ( this.plugin.settings.marker_position === undefined ? 'before' : this.plugin.settings.marker_position ) )
				dropDown.onChange(async (value) => {
					this.plugin.settings.marker_position = value;
					await this.plugin.saveSettings();
					markOpenFiles(this.app.workspace,value,true);
				})
		});
	}
}
module.exports = MarkOpenFiles;
