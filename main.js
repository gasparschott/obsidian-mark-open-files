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
		el.parentElement.classList.add('has_open_file_marker');
	let marker_container = document.createElement('div');
		marker_container.classList.add('mark_open_files_container');
		marker_container.classList.add('marker_position_'+position);
	let marker = document.createElement('span');
		marker.classList.add('mark_open_files');
		marker.dataset.leaf_id = leaf_id;
		marker.textContent = '•';
	let marker_position = ( position === 'before' ? 'afterbegin' : 'beforeend' );
	if ( !el.querySelector('.mark_open_files_container') ) {
		el.insertAdjacentElement(marker_position,marker_container);									// add marker container if needed
	}
	el.querySelector('.mark_open_files_container').insertAdjacentElement('beforeend',marker);		// add marker
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
		if ( !markers ) { return } else if ( bool === true ) { markers.forEach( marker => marker.closest('.mark_open_files_container').remove() ) }
		open_leaves.forEach( open_leaf => {
			let tree_item = file_explorer_tree?.containerEl?.querySelector('.tree-item-self[data-path="'+open_leaf?.view?.file?.path+'"]') || null;	// find tree item by leaf file path
			if ( tree_item !== null && !tree_item.querySelector('.mark_open_files[data-leaf_id="'+open_leaf.id+'"]') ) {
				addMarker((position === 'before' ? tree_item : tree_item.closest('.tree-item-self')),open_leaf.id,position );						// if no matching leaf marker, add leaf marker
			}
		});
		markers.forEach( marker => {
			if ( !open_leaves_ids.includes(marker.dataset.leaf_id) 																	// if no open leaf id matches the marker id
			|| workspace.getLeafById(marker?.dataset?.leaf_id).view.file.path !== marker.closest('.tree-item-self')?.dataset?.path ) { 	// reused leaves keep the same id, so check path instead
				marker.closest('.has_open_file_marker')?.classList?.remove('has_open_file_marker');
				marker.remove();																									// remove the marker
			}					
		});
	});
}
class HighlightOpenFiles extends obsidian.Plugin {
    async onload() {
		await this.loadSettings();
		this.addSettingTab(new MarkOpenFilesSettings(this.app, this));
		const position = this.settings.marker_position;
		const workspace = this.app.workspace;
		workspace.onLayoutReady( () => { sleep(100).then( () => { 
			if ( workspace.app.internalPlugins.getPluginById('file-explorer').enabled === false ) { alert('The plugin “Mark Open Files” requires the core “Files” plugin to be enabled.'); }
			markOpenFiles(workspace,position); }); 
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
				markOpenFiles(workspace,position);
			})
		);
		this.registerEvent(
			this.app.workspace.on('layout-change', () => {
				markOpenFiles(workspace,position);
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
		new obsidian.Setting(containerEl).setName('Marker position').setDesc('Place marker before or after file name.')
			.addDropdown((dropDown) => {
				dropDown.addOption("before", "Before");
				dropDown.addOption("after", "After");
				dropDown.setValue( ( this.plugin.settings.marker_position === undefined || this.plugin.settings.marker_position === 'before' ? 'before' : 'after' ) )
				dropDown.onChange(async (value) => {
					this.plugin.settings.marker_position = value;
					await this.plugin.saveSettings();
					markOpenFiles(this.app.workspace,value,true);
				})
		});
	}
}
module.exports = HighlightOpenFiles;
