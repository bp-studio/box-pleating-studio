<template>
	<div class="modal fade" ref="el">
		<div class="modal-dialog modal-dialog-centered">
			<div class="modal-content mx-4">
				<div class="modal-header">
					<div class="h4 modal-title" v-t="'toolbar.tools.optimizer._'"></div>
				</div>
				<div class="modal-body">
					<div v-if="state.stage == Stage.stopped">
						<div class="row">
							<label class="col-12 col-sm-4 mb-2" v-t="'toolbar.tools.optimizer.layout._'"></label>
							<div class="col mb-2">
								<div>
									<Radio name="layout_mode" v-model="options.layout" value="view"
										   :label="$t('toolbar.tools.optimizer.layout.view')" />
								</div>
								<div>
									<Radio name="layout_mode" v-model="options.layout" value="random"
										   :label="$t('toolbar.tools.optimizer.layout.random')" />
									<div class="row mt-1 ms-3 gx-3">
										<div class="col-auto col-form-label">
											Try
										</div>
										<div class="col">
											<Number v-model="options.random" :disabled="options.layout != 'random'" :min="1"
													:max="100" />
										</div>
										<div class="col-auto col-form-label">
											layouts.
										</div>
									</div>
								</div>
							</div>
						</div>

						<div class="row mt-3 mt-sm-2">
							<label class="col-12 col-sm-4 mb-2">Fitting method</label>
							<div class="col mb-2">
								<Radio name="fit_mode" v-model="options.fit" value="quick" label="Quick mode" class="me-3" />
								<Radio name="fit_mode" v-model="options.fit" value="full" label="Full mode" />
							</div>
						</div>

					</div>
					<div v-else-if="state.stage == Stage.initializing">
						Initializing...
					</div>
					<OptProgress v-else-if="state.stage == Stage.candidate" :state="state" :options="options" :value="state.major"
								 :max="options.random" @skip="skip" @stop="stop">
						Generating candidate layouts...
					</OptProgress>
					<div v-else-if="state.stage == Stage.continuous">
						<OptProgress v-if="options.layout == 'random'" :state="state" :options="options"
									 :value="(state.major - 1) + (state.minor / 50)" :max="options.random" @skip="skip"
									 @stop="stop">
							Trying random layout #{{ state.major }}, step {{ state.minor }}...
						</OptProgress>
						<div v-else>
							Pre-solving...
						</div>
					</div>
					<OptProgress v-else-if="state.stage == Stage.integral" :state="state" :options="options" :value="state.minor"
								 :max="state.flaps" noSkip @stop="stop">
						Trying grid size {{ state.major }}...
					</OptProgress>
					<div v-else-if="state.stage == Stage.error" class="text-danger">
						An error occurred: {{ state.error }}
					</div>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-secondary" :disabled="state.running" data-bs-dismiss="modal"
							@click="state.stage = Stage.stopped" v-t="'keyword.close'"></button>
					<button type="button" class="btn btn-primary" :disabled="state.running || state.stage == Stage.error"
							@click="run">
						<span v-if="state.running">
							{{ $t('toolbar.tools.optimizer.running') }}&ensp;<i class="bp-spinner fa-spin" />
						</span>
						<span v-else>
							{{ $t('toolbar.tools.optimizer.run') }}&ensp;<i class="fa-solid fa-wand-magic-sparkles" />
						</span>
					</button>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import.meta.webpackHot.dispose(() => document.querySelector(".modal-backdrop.show")?.remove());
</script>

<script setup lang="ts">

	import { reactive } from "vue";

	import Workspace from "app/services/workspaceService";
	import useModal from "./modal";
	import Number from "@/gadgets/form/number.vue";
	import OptProgress from "./components/optProgress.vue";
	import Radio from "@/gadgets/form/radio.vue";

	import type { OptimizerOptions } from "client/plugins/optimizer";
	import type { OptimizerCommand, OptimizerEvent } from "client/plugins/optimizer/types";

	defineOptions({ name: "Optimizer" });

	enum Stage {
		stopped,
		initializing,
		candidate,
		continuous,
		integral,
		error,
	};

	const { el, show, hide } = useModal("Optimizer", { backdrop: "static" });

	const state = reactive({
		stage: Stage.stopped,
		major: 0,
		minor: 0,
		flaps: 0,
		running: false,
		skipping: false,
		stopping: false,
		error: "",
	});
	const options = reactive<OptimizerOptions>({
		layout: "view",
		fit: "quick",
		random: 1,
		callback,
	});

	let handler: Consumer<OptimizerCommand> = () => { /**/ };

	function callback(event: OptimizerEvent): void {
		if(state.stopping) return;
		switch(event.event) {
			case "handle":
				handler = event.data;
				break;
			case "flap":
				state.flaps = event.data;
				break;
			case "candidate":
				updateState(Stage.candidate);
				state.major = event.data;
				break;
			case "bh":
				updateState(Stage.continuous);
				state.major = event.data;
				state.minor = 0;
				break;
			case "bhs":
				state.minor = event.data;
				break;
			case "grid":
				updateState(Stage.integral);
				state.major = event.data;
				state.minor = 0;
				break;
			case "fit": {
				const depth = event.data.length;
				if(depth > state.minor) state.minor = depth;
				else state.minor += 0.1; // For better UX
				break;
			}
			case "greedy":
				state.minor = event.data;
				break;
			default:
		}
	}

	function updateState(newState: Stage): void {
		if(state.stage != newState) {
			state.skipping = false;
			state.stopping = false;
		}
		state.stage = newState;
	}

	function skip(): void {
		state.skipping = true;
		handler("skip");
	}

	function stop(): void {
		state.stopping = true;
		handler("stop");
	}

	async function run(): Promise<void> {
		state.running = true;
		state.stage = Stage.initializing;
		try {
			await Workspace.optimize(options);
			hide();
			state.stage = Stage.stopped;
		} catch(e) {
			if(state.stopping) {
				state.stage = Stage.stopped;
			} else {
				state.error = e instanceof Error ? e.message : String(e);
				state.stage = Stage.error;
			}
		} finally {
			state.stopping = false;
			state.skipping = false;
			state.running = false;
		}
	}

	defineExpose({ show });

</script>
