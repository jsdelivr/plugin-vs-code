const got = require('got');
const vscode = require('vscode');
const pickFormat = require('./pickFormat').pickFormat;
const InputFlowAction = require('../multiStepInput').InputFlowAction;

const extensionId = 'jsdelivr';
const extensionPublisher = 'jsDelivr';

const jsDelivrEndpoint = 'https://data.jsdelivr.com/v1/package/npm/';
const userAgent = `jsDelivr Visual Studio Code plugin/${vscode.extensions.getExtension(`${extensionPublisher}.${extensionId}`).packageJSON.version}`;

async function pickFile (input, state) {
	let response;
	let minFiles = [];
	let hashes = new Map();

	try {
		response = await got(`${state.pkg.name}@${state.version}/flat`, {
			baseUrl: jsDelivrEndpoint,
			headers: {
				'user-agent': userAgent,
			},
		});
	} catch (e) {
		vscode.window.showErrorMessage('Unexpected error occurred');
		return InputFlowAction.cancel;
	}

	const body = JSON.parse(response.body);
	const defaultFile = body.default.substr(1); // remove leading `/`

	body.files.forEach((file) => {
		hashes.set(file.name.substr(1), file.hash);
	});

	let files = body.files.filter((file) => {
		// we only want .js and .css files
		return file.name.toLowerCase().endsWith('.js') || file.name.toLowerCase().endsWith('.css');
	}).map((file) => {
		return file.name.substr(1); // remove leading `/`
	});

	// deleting the default file in array
	// we'll sort the array later then add it back to index 0
	files.splice(files.indexOf(defaultFile), 1);

	files.forEach((file) => {
		// not ending with neither `.min.js` or `.min.css`
		if (!file.toLowerCase().endsWith('.min.js') && !file.toLowerCase().endsWith('.min.css')) {
			// rename to `.min.js` or `.min.css`
			minFiles.push(file.toLowerCase().endsWith('.js') ? file.replace(/\.js$/i, '.min.js') : file.replace(/\.css$/i, '.min.css'));
		}
	});

	let completeFileList = files.concat(minFiles)
		.filter((v, i, a) => a.indexOf(v) === i) // no duplicates!
		.sort((file1, file2) => {
			return file1 > file2 ? 1 : -1; // sort alphabetically (https://stackoverflow.com/a/7087833/2465955)
		});

	completeFileList.unshift(defaultFile); // we insert default file to first of file list

	const pick = await input.showQuickPick({
		title: 'Pick file',
		step: 3,
		totalSteps: 4,
		placeholder: 'Pick file',
		items: completeFileList.map((file) => {
			return { label: file };
		}),
	});

	state.file = pick.label;

	if (files.includes(pick.label)) {
		state.hash = hashes.get(pick.label);
		state.isGenMin = false;
	} else {
		state.isGenMin = true;
	}

	return input => pickFormat(input, state);
}

exports.pickFile = pickFile;
