module.exports = {
	projects: [
		{
			root: './src/app',
			package: '../../package.json',
			tsconfig: './tsconfig.json',
		},
		{
			root: './src/other/donate',
			package: '../../../package.json',
			tsconfig: './tsconfig.json',
		},
	],
};
