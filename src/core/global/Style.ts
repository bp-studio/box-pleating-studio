
type StyleDeclaration = Record<string, any>;

//////////////////////////////////////////////////////////////////
// Style
//////////////////////////////////////////////////////////////////

namespace Style {
	export const circle: StyleDeclaration = {
		strokeWidth: 1,
		strokeColor: "#69F"
	};

	export const dot: StyleDeclaration = {
		fillColor: "#69F",
		strokeWidth: 1,
		strokeColor: "#000",
		radius: 3
	};

	export const dotSelected: StyleDeclaration = {
		strokeWidth: 3,
		strokeColor: "red",
	};

	export const hinge: StyleDeclaration = {
		strokeColor: '#69F',
		strokeWidth: 3,
	};

	export const sheet: StyleDeclaration = {
		strokeWidth: 0.25,
		strokeColor: "#000"
	};

	export const label: StyleDeclaration = {
		point: [0, 0],
		fillColor: 'black',
		fontWeight: 'normal',
		strokeWidth: 0.5,
		fontSize: 14
	};

	export const glow: StyleDeclaration = {
		point: [0, 0],
		fontWeight: 'normal',
		fillColor: 'white',
		strokeWidth: 2.5,
		strokeColor: 'white',
		fontSize: 14
	};

	export const edge: StyleDeclaration = {
		strokeWidth: 2
	};

	export const ridge: StyleDeclaration = {
		strokeWidth: 1.25,
		strokeColor: "red"
	};

	export const selection: StyleDeclaration = {
		strokeColor: "#69f",
		fillColor: "rgba(102, 153, 255, 0.2)"
	};

	export const shade: StyleDeclaration = {
		fillColor: '#69F',
		opacity: 0.3,
		strokeWidth: 0,
	};

	export const junction: StyleDeclaration = {
		strokeColor: "red",
		fillColor: "red",
		opacity: 0.3,
	};

	export const axisParallel: StyleDeclaration = {
		strokeWidth: 1,
		strokeColor: "green"
	};

	export const top: StyleDeclaration = {};
}
