declare module 'vue-property-decorator' {
	interface Vue {
		$t(path: string, data?: any): string;
		_uid: string;
	}
}

export interface FileFactory {
	name: string;
	content: () => string | Promise<string>;
}

export function sanitize(filename: string): string;
