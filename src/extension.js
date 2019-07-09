const vscode = require('vscode');
const MultiStepInput = require('./multiStepInput').MultiStepInput;
const pickPackage = require('./steps/pickPackage').pickPackage;

function activate (context) {
	async function collectInputs () {
		const state = {};
		await MultiStepInput.run(input => pickPackage(input, state));
		return state;
	}

	let disposable = vscode.commands.registerCommand('jsDelivr.addPkg', () => {
		if (vscode.window.activeTextEditor === undefined) {
			vscode.window.showErrorMessage('JsDelivr plugin requires a text editor to be open.');
			return;
		}

		collectInputs();
	});

	context.subscriptions.push(disposable);
}

exports.activate = activate;

function deactivate () {}

module.exports = {
	activate,
	deactivate,
};
