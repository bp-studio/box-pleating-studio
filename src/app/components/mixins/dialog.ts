import { Vue, Component } from 'vue-property-decorator';

@Component
export default abstract class Dialog<T> extends Vue {
	private promise: Promise<T> = null;
	protected message: string

	public async show(message?: string): Promise<T> {
		this.message = message;
		while(this.promise) await this.promise;
		return await (this.promise = this.run());
	}

	private run(): Promise<T> {
		let el = $(this.$el);
		let p = new Promise<T>(resolve =>
			this.resolve((v: T) => {
				this.promise = null;
				resolve(v);
			}, el)
		);
		el.modal({ backdrop: 'static' });
		return p;
	}

	protected abstract resolve(resolve: (v: T) => void, el: JQuery<Element>): void;
}
