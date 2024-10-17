<template>
	<div class="modal fade" ref="el">
		<div class="modal-dialog modal-dialog-centered">
			<div class="modal-content mx-4">
				<div class="modal-header">
					<div class="h4 modal-title" v-t="'plugin.optimizer._'"></div>
				</div>
				<div class="modal-body" v-if="hasBigInt64Array">
					<div v-if="state.stage == Stage.stopped">
						<div class="row mb-2">
							<label class="col-12 col-sm-4 col-form-label fw-bolder" v-t="'plugin.optimizer.options._'"></label>
							<div class="col">
								<Toggle v-model="options.openNew">{{ $t('plugin.optimizer.options.openNew') }}</Toggle>
								<Toggle v-model="options.useDimension">{{ $t('plugin.optimizer.options.useDim') }}</Toggle>
							</div>
						</div>
						<div class="row">
							<label class="col-12 col-sm-4 mb-2 col-form-label fw-bolder"
								   v-t="'plugin.optimizer.layout._'"></label>
							<div class="col mb-2">
								<select class="form-select" v-model="options.layout">
									<option value="view" v-t="'plugin.optimizer.layout.view'"></option>
									<option value="random" v-t="'plugin.optimizer.layout.random'"></option>
								</select>
								<div class="row" v-if="options.layout == 'view'">
									<Toggle v-model="options.useBH">{{ $t('plugin.optimizer.layout.useBH') }}</Toggle>
								</div>
								<div class="row mt-2 gx-3" v-if="options.layout == 'random'">
									<div class="col-auto col-form-label" v-t="'plugin.optimizer.layout.toTry'"></div>
									<div class="col">
										<Number v-model="options.random" :disabled="options.layout != 'random'" :min="1"
												:max="100" />
									</div>
								</div>
							</div>
						</div>
						<div class="row mt-3 mt-sm-2">
							<label class="col-12 col-sm-4 mb-2 fw-bolder" v-t="'plugin.optimizer.fit._'"></label>
							<div class="col mb-2">
								<Radio name="fit_mode" v-model="options.fit" value="quick"
									   :label="$t('plugin.optimizer.fit.quick')" class="me-3" />
								<Radio name="fit_mode" v-model="options.fit" value="full"
									   :label="$t('plugin.optimizer.fit.full')" />
							</div>
						</div>

					</div>
					<OptProgress v-else-if="state.stage == Stage.initializing" :value="state.minor"
								 :max="hasTransformStream ? 100 : 1" noSkip>
						Initializing<span v-if="hasTransformStream"> ({{ state.minor.toFixed(1) }}%)</span>...
					</OptProgress>
					<OptProgress v-else-if="state.stage == Stage.candidate" :value="state.minor" :max="state.major">
						Generating candidate layouts ({{ (state.minor / state.major * 100).toFixed(1) }}%)...
					</OptProgress>
					<div v-else-if="state.stage == Stage.continuous">
						<OptProgress v-if="options.layout == 'random'" :value="(state.major - 1) * 50 + state.minor"
									 :max="options.random * 50">
							Trying random layout #{{ state.major }}, step {{ state.minor }}<span v-if="state.best < 8192"> (Best
								size {{ state.best }})</span>...
						</OptProgress>
						<OptProgress v-else-if="options.useBH" :value="state.minor" :max="50">
							Pre-solving, step {{ state.minor }}<span v-if="state.best < 8192"> (Best size {{ state.best
								}})</span>...
						</OptProgress>
						<div v-else>
							Pre-solving...
						</div>
					</div>
					<OptProgress v-else-if="state.stage == Stage.preInt" :value="state.minor" :max="200">
						Pre-fitting ({{ (state.minor / 2).toFixed(1) }}%)...
					</OptProgress>
					<OptProgress v-else-if="state.stage == Stage.integral" :value="state.minor" :max="state.flaps">
						Trying grid size {{ state.major }} ({{ state.minor }} / {{ state.flaps }})...
					</OptProgress>
					<div v-else-if="state.stage == Stage.error" class="text-danger">
						An error occurred: {{ state.error }}
					</div>
				</div>
				<div class="modal-body" v-else v-t="'plugin.optimizer.unsupported'"></div>
				<div class="modal-footer">
					<button type="button" class="btn btn-secondary" :disabled="state.running" data-bs-dismiss="modal"
							@click="state.stage = Stage.stopped" v-t="'keyword.close'"></button>
					<button v-if="hasBigInt64Array" type="button" class="btn btn-primary"
							:disabled="state.running || state.stage == Stage.error" @click="run">
						<span v-if="state.running">
							{{ $t('plugin.optimizer.running') }}&ensp;<i class="bp-spinner fa-spin" />
						</span>
						<span v-else>
							{{ $t('plugin.optimizer.run') }}&ensp;<i class="fa-solid fa-play" />
						</span>
					</button>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	if(import.meta.webpackHot) {
		import.meta.webpackHot.dispose(() => document.querySelector(".modal-backdrop.show")?.remove());
	}
</script>

<script setup lang="ts">

	import { provide, reactive } from "vue";

	import Workspace from "app/services/workspaceService";
	import useModal from "./modal";
	import Number from "@/gadgets/form/number.vue";
	import OptProgress, { contextKey } from "./components/optProgress.vue";
	import Radio from "@/gadgets/form/radio.vue";
	import Toggle from "@/gadgets/form/toggle.vue";
	import { hasBigInt64Array } from "app/shared/constants";

	import type { OptimizerOptions } from "client/plugins/optimizer";
	import type { OptimizerCommand, OptimizerEvent } from "client/plugins/optimizer/types";

	defineOptions({ name: "Optimizer" });

	enum Stage {
		stopped,
		initializing,
		candidate,
		continuous,
		preInt,
		integral,
		error,
	};

	const { el, show, hide } = useModal("Optimizer", { backdrop: "static" });
	const hasTransformStream = typeof TransformStream != "undefined";

	const state = reactive({
		stage: Stage.stopped,
		major: 0,
		minor: 0,
		best: 0,
		flaps: 0,
		running: false,
		skipping: false,
		stopping: false,
		error: "",
	});
	const options = reactive<OptimizerOptions>({
		layout: "view",
		openNew: true,
		useDimension: true,
		useBH: false,
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
			case "loading":
				state.minor = event.data;
				break;
			case "flap":
				state.flaps = event.data;
				break;
			case "candidate":
				updateState(Stage.candidate);
				[state.minor, state.major] = event.data;
				break;
			case "bh":
				updateState(Stage.continuous);
				[state.major, state.minor, state.best] = event.data;
				break;
			case "int":
				updateState(Stage.preInt);
				state.minor = event.data[0];
				break;
			case "fit": {
				updateState(Stage.integral);
				if(event.data[0] != state.major) {
					state.major = event.data[0];
					state.minor = 0;
				} else {
					const depth = event.data[1].length;
					if(depth > state.minor) state.minor = depth;
				}
				break;
			}
			case "greedy":
				updateState(Stage.integral);
				[state.major, state.minor] = event.data;
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

	provide(contextKey, {
		state,
		skip(): void {
			state.skipping = true;
			handler("skip");
		},
		stop(): void {
			state.stopping = true;
			handler("stop");
		},
	});

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
