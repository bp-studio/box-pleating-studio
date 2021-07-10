
//////////////////////////////////////////////////////////////////
/**
 * {@link StretchContainer} 映射 Team 成 {@link Stretch}。
 */
//////////////////////////////////////////////////////////////////

@shrewd class StretchContainer extends Mapping<string, Stretch> {

	constructor(design: Design) {
		super(
			() => design.$junctions.$teams.keys(),
			signature => new Stretch(design.$LayoutSheet, signature)
		);
	}

	@shrewd public get $active(): Stretch[] {
		return [...this.values()].filter(s => s._isActive && Boolean(s.$pattern));
	}

	@shrewd public get $byQuadrant(): ReadonlyMap<Quadrant, Stretch> {
		let result = new Map<Quadrant, Stretch>();
		for(let s of this.values()) {
			if(s._isActive) {
				for(let o of s.$junctions) {
					result.set(o.q1!, s);
					result.set(o.q2!, s);
				}
			}
		}
		return result;
	}

	public $getByQuadrant(quadrant: Quadrant): Stretch | null {
		return this.$byQuadrant.get(quadrant) ?? null;
	}

	@shrewd public get $openAnchors(): Map<string, Point[]> {
		let result = new Map<string, Point[]>();
		for(let s of this.$active) {
			let f = s.fx * s.fy;
			for(let d of s.$pattern!.$devices) {
				for(let a of d.$openAnchors) {
					let key = f + "," + (a.x - f * a.y);
					let arr = result.get(key);
					if(!arr) result.set(key, arr = []);
					arr.push(a);
				}
			}
		}
		return result;
	}

	/**
	 * 當前所有的 {@link Device}。這個列表是用來提供給 CPSheet 的控制項工廠用的。
	 */
	@shrewd public get $devices(): Device[] {
		let result: Device[] = [];
		for(let s of this.values()) result.push(...s.$devices);
		return result;
	}

	@shrewd public get $patternNotFound(): boolean {
		return [...this.values()].some(s => s.$isTotallyValid && s.$pattern == null);
	}
}
