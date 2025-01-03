<template>
	<div class="modal fade" ref="el">
		<div class="modal-dialog modal-dialog-centered">
			<div class="modal-content mx-4">
				<div class="modal-header h4 d-flex">
					<div class="modal-title flex-grow-1">{{ $t("plugin.optimizer._") }}</div>
					<a class="text-info" href="https://bp-studio.github.io/manual.html#layout-optimization" target="_blank">
						<i class="fa-regular fa-circle-question"></i>
					</a>
				</div>
				<div class="modal-body" v-if="support">
					<div v-if="state.stage == Stage.stopped">
						<div class="row mb-2">
							<label class="col-12 col-sm-4 col-form-label fw-bolder">{{ $t("plugin.optimizer.options._") }}</label>
							<div class="col">
								<Toggle v-model="options.openNew">{{ $t('plugin.optimizer.options.openNew') }}</Toggle>
								<Toggle v-model="options.useDimension">{{ $t('plugin.optimizer.options.useDim') }}</Toggle>
							</div>
						</div>
						<div class="row">
							<label class="col-12 col-sm-4 mb-2 col-form-label fw-bolder"
								  >{{ $t("plugin.optimizer.layout._") }}</label>
							<div class="col mb-2">
								<select class="form-select" v-model="options.layout">
									<option value="view">{{ $t("plugin.optimizer.layout.view") }}</option>
									<option value="random">{{ $t("plugin.optimizer.layout.random") }}</option>
								</select>
								<div class="row" v-if="options.layout == 'view'">
									<Toggle v-model="options.useBH">{{ $t('plugin.optimizer.layout.useBH') }}</Toggle>
								</div>
								<div class="row mt-2 gx-3" v-if="options.layout == 'random'">
									<div class="col-auto col-form-label">{{ $t("plugin.optimizer.layout.toTry") }}</div>
									<div class="col">
										<Number v-model="options.random" :disabled="options.layout != 'random'" :min="1"
												:max="100" />
									</div>
								</div>
							</div>
						</div>
					</div>
					<OptProgress v-else-if="state.stage == Stage.initializing" :value="state.minor" :max="1" noSkip percentage>
						Initializing...
					</OptProgress>
					<OptProgress v-else-if="state.stage == Stage.start" :value="0" :max="1" noSkip percentage>
						Processing problem...
					</OptProgress>
					<OptProgress v-else-if="state.stage == Stage.candidate" :value="state.minor" :max="state.major" percentage>
						Generating candidate layouts...
					</OptProgress>
					<div v-else-if="state.stage == Stage.continuous">
						<OptProgress v-if="options.layout == 'random'" :value="(state.major - 1) * 50 + state.minor"
									 :max="options.random * 50" percentage>
							Trying random layout #{{ state.major }}, step {{ state.minor }}<span v-if="state.best < 8192"> (Best
								size {{ state.best }})</span>...
						</OptProgress>
						<OptProgress v-else-if="options.useBH" :value="state.minor" :max="50">
							Pre-solving<span v-if="state.best < 8192 && state.best > 0"> (Best size {{ state.best
								}})</span>...
						</OptProgress>
					</div>
					<OptProgress v-else-if="state.stage == Stage.pack" :value="state.minor" :max="packTransform(200)" noSkip
								 percentage>
						Pre-solving...
					</OptProgress>
					<OptProgress v-else-if="state.stage == Stage.integral" :value="state.minor" :max="state.flaps">
						Trying grid size {{ state.major }}...
					</OptProgress>
					<div v-else-if="state.stage == Stage.error" class="text-danger w-100"
						 style="overflow: scroll; max-height: 60vh;">
						<pre>An error occurred: {{ state.error }}</pre>
					</div>
				</div>
				<div class="modal-body" v-else>{{ $t("plugin.optimizer.unsupported") }}</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-secondary" :disabled="state.running" data-bs-dismiss="modal"
							@click="state.stage = Stage.stopped">{{ $t("keyword.close") }}</button>
					<button v-if="support" type="button" class="btn btn-primary"
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

	import { provide, reactive, shallowRef } from "vue";

	import Workspace from "app/services/workspaceService";
	import Settings from "app/services/settingService";
	import useModal from "./modal";
	import Number from "@/gadgets/form/number.vue";
	import OptProgress, { contextKey } from "./components/optProgress.vue";
	import Toggle from "@/gadgets/form/toggle.vue";

	import type { OptimizerCommand, OptimizerEvent } from "client/plugins/optimizer/types";

	defineOptions({ name: "Optimizer" });

	enum Stage {
		stopped,
		initializing,
		start,
		pack,
		candidate,
		continuous,
		integral,
		error,
	};

	const { el, show, hide } = useModal("Optimizer", { backdrop: "static" });
	const support = shallowRef(true);

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
	const options = Settings.tools.Optimizer;

	let handler: Consumer<OptimizerCommand> = () => { /**/ };

	function packTransform(n: number): number {
		// eslint-disable-next-line @typescript-eslint/no-magic-numbers
		return Math.log(n + 1) * 10;
	}

	function callback(event: OptimizerEvent): void {
		if(state.stopping || !state.running) return;
		switch(event.event) {
			case "handle":
				handler = event.data;
				break;
			case "flap":
				state.flaps = event.data;
				break;
			case "start":
				updateState(Stage.start);
				break;
			case "pack":
				updateState(Stage.pack);
				state.minor = packTransform(event.data);
				break;
			case "candidate":
				updateState(Stage.candidate);
				[state.minor, state.major] = event.data;
				break;
			case "cont":
				updateState(Stage.continuous);
				[state.major, state.minor, state.best] = event.data;
				break;
			case "fit":
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
			gtag("event", "optimizer_skip", { data1: Stage[state.stage] });
			handler("skip");
		},
		stop(): void {
			state.stopping = true;
			gtag("event", "optimizer_stop", { data1: Stage[state.stage] });
			handler("stop");
		},
	});

	async function run(): Promise<void> {
		gtag("event", "optimizer_start");
		state.running = true;
		state.minor = 0;
		state.stage = Stage.initializing;
		try {
			await Workspace.optimize(options, callback);
			hide();
			state.stage = Stage.stopped;
		} catch(e) {
			if(state.stopping) {
				state.stage = Stage.stopped;
			} else {
				const error = e instanceof Error ? e.message : String(e);
				if(error == "initError") {
					support.value = false;
				} else {
					state.error = error;
					gtag("event", "optimizer_error", { data1: state.error, data2: Stage[state.stage] });
					state.stage = Stage.error;
				}
			}
		} finally {
			state.stopping = false;
			state.skipping = false;
			state.running = false;
		}
	}

	defineExpose({ show });

</script>
