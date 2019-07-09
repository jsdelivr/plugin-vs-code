const pickFile = require('./pickFile').pickFile;
const semver = require('semver');

async function pickVersion (input, state) {
	Object.keys(state.pkg.versions).forEach((version) => {
		if (!semver.valid(version)) {
			delete state.pkg.versions[version];
		}
	});

	let versions = semver.rsort(Object.keys(state.pkg.versions));

	const pick = await input.showQuickPick({
		title: 'Pick version',
		step: 2,
		totalSteps: 4,
		placeholder: 'Pick version',
		items: versions.map((version) => {
			return { label: version };
		}),
	});

	state.version = pick.label;
	return input => pickFile(input, state);
}

exports.pickVersion = pickVersion;
