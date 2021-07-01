<template>
	<submenu icon="fas fa-history" :label="$t('toolbar.file.recent.title')">
		<dropdownitem v-if="recent.length==0" disabled>{{$t('toolbar.file.recent.empty')}}</dropdownitem>
		<template v-else>
			<dropdownitem v-for="(h,i) in recent" :key="i" @click="$emit('open', h)">
				<i></i>
				{{h.name}}
			</dropdownitem>
			<divider></divider>
			<dropdownitem @click="clearRecent">
				<i class="fas fa-trash-alt"></i>
				{{$t('toolbar.file.recent.clear')}}
			</dropdownitem>
		</template>
	</submenu>
</template>

<script lang="ts">
	import { Component, Vue } from 'vue-property-decorator';

	@Component
	export default class RecentMenu extends Vue {

		protected get recent(): FileSystemFileHandle[] {
			return core.handles.recent;
		}

		protected clearRecent(): void {
			core.handles.recent = [];
			core.handles.save();
		}
	}
</script>
