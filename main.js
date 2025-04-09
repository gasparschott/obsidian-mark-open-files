'use strict';

let obsidian = require('obsidian');
let DEFAULT_SETTINGS = {
	'keyboard_shortcuts': []
};

class HighlightOpenFiles extends obsidian.Plugin {
    async onload() {
		// await this.loadSettings();
		const workspace = this.app.workspace;
		const addMarker = (el,leaf_id) => {
			let marker_container = `<div class="marker_container"></div>`;
			let marker = `<span class="marker" data-leaf_id="${leaf_id}">•</span>`;
			if ( !el.querySelector('.marker_container') ) {
				el.insertAdjacentHTML('afterbegin',marker_container);
			}
			el.querySelector('.marker_container').insertAdjacentHTML('beforeend',marker);
		}
		const awaitFileExplorer = () => {
			return new Promise( (resolve) => {
				resolve(workspace.getLeavesOfType('file-explorer')[0]);
			})
		}
		const highlight_open_files = obsidian.debounce( async () => {
			awaitFileExplorer().then( () => {
 				const file_explorer_tree = workspace.getLeavesOfType('file-explorer')[0].view.tree;
				const getOpenItems = () => { 
					let open_leaves = [], open_leaves_ids = [];
					workspace.iterateRootLeaves( leaf => { leaf.loadIfDeferred(); open_leaves.push(leaf); open_leaves_ids.push(leaf.id); } );
					return [open_leaves,open_leaves_ids];
				};
				let open_items = getOpenItems(), open_leaves = open_items[0], open_leaves_ids = open_items[1], open_leaves_paths = open_items[2];
				let getMarkers = () => { return file_explorer_tree.containerEl.querySelectorAll('.marker') };
				open_leaves.forEach( open_leaf => {
					let tree_item = file_explorer_tree.containerEl.querySelector('.tree-item-self[data-path="'+open_leaf?.view?.file?.path+'"]') || null;	// find tree item by leaf file path
					if ( tree_item !== null && !tree_item.querySelector('.marker[data-leaf_id="'+open_leaf.id+'"]') ) {
						addMarker(tree_item.querySelector('.tree-item-inner'),open_leaf.id );												// if no matching leaf marker, add leaf marker
					}
				});
				getMarkers().forEach( marker => {
					if ( !open_leaves_ids.includes(marker.dataset.leaf_id) 																	// if no open leaf id matches the marker id
					|| workspace.getLeafById(marker.dataset.leaf_id).view.file.path !== marker.closest('.tree-item-self').dataset.path ) { 	// reused leaves keep the same id, so check path instead
						marker.remove();																									// remove the marker
					}					
				});
			});
		},100);
		workspace.onLayoutReady( () => { sleep(100).then( () => { highlight_open_files(); }); });												// initialize
		this.registerDomEvent(document,'mousedown', (e) => {
			if ( e.target.classList.contains('marker') ) {
				e.stopPropagation(); e.stopImmediatePropagation; e.preventDefault();
				e.target.addEventListener('click', function(e) { 
					e.stopPropagation(); workspace.setActiveLeaf(workspace.getLeafById(e.srcElement.dataset.leaf_id),{focus:true});
					workspace.getLeafById(e.srcElement.dataset.leaf_id).tabHeaderEl.click();												// trigger Continuous Mode plugin scroll into view
				});
			}
		})
		this.registerDomEvent(document,'mouseup', (e) => {
			if ( e.target.classList.contains('marker') ) {
				e.stopPropagation(); e.stopImmediatePropagation; e.preventDefault();
			}
		})
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => {
				highlight_open_files();
			})
		);
		this.registerEvent(
			this.app.workspace.on('layout-change', () => {
				highlight_open_files();
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
