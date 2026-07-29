<template>
	<button
		v-if="Studio.project?.design.layout.patternNotFound"
		id="note"
		class="btn btn-light text-warning"
		@click="show"
	>
		<i class="fas fa-exclamation-triangle h1 my-1"/>
	</button>
	<div ref="el" class="modal fade">
		<div class="modal-dialog modal-dialog-centered">
			<div class="modal-content">
				<div class="modal-body">{{ $t("message.patternNotFound") }}</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-primary" data-bs-dismiss="modal">{{ $t("keyword.ok") }}</button>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">

	import Studio from "app/services/studioService";
	import useModal from "./modal";

	defineOptions({ name: "Note" });

	const { el, show } = useModal("Note");

</script>
