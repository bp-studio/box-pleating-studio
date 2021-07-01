
declare module 'vue-property-decorator' {
	interface Vue {
		_uid: string;
	}
}

export interface FileFactory {
	name: string;
	content: () => null | Blob | Promise<Blob>;
}

