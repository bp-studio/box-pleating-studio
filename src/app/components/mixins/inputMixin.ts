import { Vue, Component, Watch, Prop } from 'vue-property-decorator';

@Component
export default class InputMixin extends Vue {

	@Prop(null) public value: any;

	protected id: string = "field" + this._uid;
	protected v: any = null;
	protected focused: boolean = false;

	protected mounted() { this.v = this.value; }

	@Watch('value') onValueChange(v: any) { if(!this.focused) this.v = v; }

	public blur() {
		this.v = this.value;
		this.focused = false;
	}

	public focus(event: FocusEvent) {
		this.focused = true;
		(event.target as HTMLInputElement).select();
	}

	public input(event: InputEvent) {
		this.v = (event.target as HTMLInputElement).value;
		this.$emit('input', this.v);
	}
}
