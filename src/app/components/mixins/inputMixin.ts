import { Component, Prop, Vue, Watch } from 'vue-property-decorator';

@Component
export default class InputMixin extends Vue {

	@Prop(undefined) public value: unknown;

	protected id: string = "field" + this._uid;
	protected v: unknown = null;
	protected focused: boolean = false;

	protected mounted(): void {
		this.v = this.value;
	}

	@Watch('value') onValueChange(v: unknown): void {
		if(!this.focused) this.v = v;
	}

	public blur(): void {
		this.v = this.value;
		this.focused = false;
	}

	public focus(event: FocusEvent): void {
		this.focused = true;
		(event.target as HTMLInputElement).select();
	}

	public input(event: InputEvent): void {
		this.v = (event.target as HTMLInputElement).value;
		this.$emit('input', this.v);
	}
}
