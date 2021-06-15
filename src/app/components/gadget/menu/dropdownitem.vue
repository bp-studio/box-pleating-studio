<template>
	<div v-if="!disabled" class="dropdown-item" @click="$emit('click')">
		<slot></slot>
	</div>
	<div v-else class="dropdown-item disabled" @click.stop>
		<slot></slot>
	</div>
</template>

<script lang="ts">
	import { Vue, Component, Prop } from 'vue-property-decorator';

	@Component
	export default class DropdownItem extends Vue {
		@Prop(Boolean) public disabled: boolean;
	}
</script>