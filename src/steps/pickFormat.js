const vscode = require('vscode');

const jsDelivrUrl = 'https://cdn.jsdelivr.net/npm/';

let insertText = function (text) {
	let editor = vscode.window.activeTextEditor;

	if (editor === undefined) {
		vscode.window.showErrorMessage('JsDelivr plugin requires a text editor to be open.');
		return;
	}

	editor.edit(edit => editor.selections.forEach((selection) => {
		edit.delete(selection);
		edit.insert(selection.start, text);
	}));
};

async function pickFormat (input, state) {
	let options = [ 'Insert URL', 'Insert HTML' ];

	if (!state.isGenMin) {
		options.push('Insert HTML + SRI');
	}

	const pick = await input.showQuickPick({
		title: 'Pick insert format',
		step: 4,
		totalSteps: 4,
		placeholder: 'Pick insert format',
		items: options.map((option) => {
			return { label: option };
		}),
	});

	let url = `${jsDelivrUrl}${state.pkg.name}@${state.version}/${state.file}`;

	if (pick.label === options[0]) {
		insertText(url);
	} else if (pick.label === options[1]) {
		if (state.file.endsWith('.js')) {
			insertText(`<script src="${url}"></script>`);
		} else {
			insertText(`<link rel="stylesheet" href="${url}">`);
		}
	} else if (pick.label === 'Insert HTML + SRI') {
		if (state.file.endsWith('.js')) {
			insertText(`<script src="${url}" integrity="sha256-${state.hash}" crossorigin="anonymous"></script>`);
		} else {
			insertText(`<link rel="stylesheet" href="${url}" integrity="sha256-${state.hash}" crossorigin="anonymous">`);
		}
	}
}

exports.pickFormat = pickFormat;
