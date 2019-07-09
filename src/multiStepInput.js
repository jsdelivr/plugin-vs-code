const vscode = require('vscode');

class InputFlowAction {

}

InputFlowAction.back = new InputFlowAction();
InputFlowAction.cancel = new InputFlowAction();
InputFlowAction.resume = new InputFlowAction();

exports.InputFlowAction = InputFlowAction;

class MultiStepInput {
	constructor () {
		this.steps = [];
	}

	static async run (start) {
		const input = new MultiStepInput();
		return input.stepThrough(start);
	}

	async stepThrough (start) {
		let step = start;

		while (step) {
			this.steps.push(step);
			if (this.current) {
				this.current.enabled = false;
				this.current.busy = true;
			}

			try {
				step = await step(this);
			} catch (err) {
				if (err === InputFlowAction.back) {
					this.steps.pop();
					step = this.steps.pop();
				} else if (err === InputFlowAction.resume) {
					step = this.steps.pop();
				} else if (err === InputFlowAction.cancel) {
					step = undefined;
				} else {
					throw err;
				}
			}
		}

		if (this.current) {
			this.current.dispose();
		}
	}

	async showQuickPick ({ title, step, totalSteps, items, activeItem, placeholder, buttons, onChangeValue }) {
		const disposables = [];

		try {
			return await new Promise((resolve, reject) => {
				const input = vscode.window.createQuickPick();

				input.title = title;
				input.step = step;
				input.totalSteps = totalSteps;
				input.placeholder = placeholder;
				input.items = items;
				if (activeItem) {
					input.activeItems = [ activeItem ];
				}

				input.buttons = [
					...this.steps.length > 1 ? [ vscode.QuickInputButtons.Back ] : [],
					...buttons || [],
				];
				disposables.push(
					input.onDidTriggerButton((item) => {
						if (item === vscode.QuickInputButtons.Back) {
							reject(InputFlowAction.back);
						} else {
							resolve(item);
						}
					}),
					input.onDidChangeSelection(items => resolve(items[0])),
					input.onDidChangeValue(() => {
						if (onChangeValue) {
							onChangeValue(input.value, input);
						}
					})
				);
				if (this.current) {
					this.current.dispose();
				}

				this.current = input;
				this.current.show();
			});
		} finally {
			disposables.forEach(d => d.dispose());
		}
	}
}

exports.MultiStepInput = MultiStepInput;
