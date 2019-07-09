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
		response = await got(`${state.pkg.name}@${state.version}/flat`, { baseUrl: jsDelivrEndpoint, headers: { 'user-agent': userAgent } });
	} catch (e) {
		vscode.window.showErrorMessage('Unexpected error occurred');
		return InputFlowAction.cancel;
	}

	JSON.parse(response.body).files.forEach((file) => {
		hashes.set(file.name.substr(1), file.hash);
	});

	let files = JSON.parse(response.body).files.filter((file) => {
		return file.name.toLowerCase().endsWith('.js') || file.name.toLowerCase().endsWith('.css');
	}).map((file) => {
		return file.name.substr(1);
	});

	files.forEach((file) => {
		if (!file.toLowerCase().endsWith('.min.js') && !file.toLowerCase().endsWith('.min.css')) {
			minFiles.push(file.toLowerCase().endsWith('.js') ? file.replace(/\.js$/i, '.min.js') : file.replace(/\.css$/i, '.min.css'));
		}
	});

	let completeFileList = files.concat(minFiles)
		.filter((v, i, a) => a.indexOf(v) === i)
		.sort((file1, file2) => {
			return file1 > file2 ? 1 : -1;
		});

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
