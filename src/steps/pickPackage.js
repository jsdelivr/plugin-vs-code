const algoliasearch = require('algoliasearch');
const pickVersion = require('./pickVersion').pickVersion;
const InputFlowAction = require('../multiStepInput').InputFlowAction;
const vscode = require('vscode');

const appId = 'OFCNCOG2CU';
const apiKey = 'f54e21fa3a2a0160595bb058179bfb1e';
const indexName = 'npm-search';

async function pickPackage (input, state) {
	let client = algoliasearch(appId, apiKey);
	let index = client.initIndex(indexName);

	let response;

	try {
		response = await index.search('');
	} catch (e) {
		vscode.window.showErrorMessage('Unexpected error occurred');
		return InputFlowAction.cancel;
	}

	const pick = await input.showQuickPick({
		title: 'Pick package',
		step: 1,
		totalSteps: 4,
		placeholder: 'Pick package',
		items: response.hits.map((hit) => {
			return { label: hit.name };
		}),
		onChangeValue: async (value, input) => {
			input.items = [];

			try {
				response = await index.search(value);
			} catch (e) {
				vscode.window.showErrorMessage('Unexpected error occurred');
				return;
			}

			if (value === input.value) {
				input.items = response.hits.map((hit) => {
					return { label: hit.name };
				});
			}
		},
	});

	let findPkg = function (pkg) {
		return pkg.name === pick.label;
	};

	state.pkg = response.hits.find(findPkg);
	return input => pickVersion(input, state);
}

exports.pickPackage = pickPackage;
