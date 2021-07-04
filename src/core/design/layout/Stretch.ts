
interface JStretch {
	id: string;

	/** 如果找不到 {@link Pattern} 就會是 undefined */
	configuration?: JConfiguration;

	/** 如果找不到 {@link Pattern} 就會是 undefined */
	pattern?: JPattern;
}

//////////////////////////////////////////////////////////////////
/**
 * {@link Stretch} 對應於一個 {@link Junction} 群組。
 * 這樣的一個群組上面所使用的摺式必須整體一起決定。
 */
//////////////////////////////////////////////////////////////////

@shrewd class Stretch extends Control implements ISerializable<JStretch> {

	public get $type(): string { return "Stretch"; }
	public get $tag(): string { return "s" + this.$signature; }

	/**
	 * 構成這個 {@link Stretch} 的所有 {@link Junction} 之陣列。
	 *
	 * 這裡面的 {@link Junction} 順序是依照對應的 {@link Flap} 來排序的。
	 */
	@shrewd public get $junctions(): readonly Junction[] {
		let result = this.$design.$junctions.$teams.get(this.$signature) ?? [];
		if(this._junctionCache && this._junctionCache.length == result.length) {
			for(let i in result) {
				if(result[i] != this._junctionCache[i]) {
					return this._junctionCache = result;
				}
			}
			return this._junctionCache;
		} else {
			return this._junctionCache = result;
		}
	}
	private _junctionCache: readonly Junction[];

	@shrewd private get _flaps(): readonly Flap[] {
		let s = new Set<Flap>();
		for(let j of this.$junctions) {
			s.add(j.f1);
			s.add(j.f2);
		}
		return Array.from(s);
	}

	/** {@link Stretch} 的簽章，格式就是所有 {@link Flap} 的 id 以逗點隔開 */
	public readonly $signature: string;

	constructor(sheet: Sheet, signature: string) {
		super(sheet);
		this.$signature = signature;
	}

	/**
	 * 整個 {@link Stretch} 的參考原點，固定取為第一個 {@link Flap} 的頂點
	 *
	 * 如果當牽涉到的 {@link Flap} 全部同步移動時，就可以根據這個點來自動移動所有對應的 {@link Pattern}。
	 */
	public get origin(): Point {
		return this.$junctions[0]?.q1?.$point ?? Point.ZERO;
	}

	/**
	 * 當 {@link Stretch} 的結構因為拖曳而暫時發生改變時，
	 * 把原本的、以及過程中所有產生出來的 {@link Repository} 都加以快取，
	 * 以改進程式效能並且便於拖曳完成後快速還原。
	 */
	private _repoCache: Map<string, Repository> = new Map();

	/** 當前使用的 {@link Repository} */
	@shrewd public get $repository(): Repository | null {
		if(!this.$isValid) return null;
		let structure = this.$structureSignature;
		let result: Repository;

		if(this._repoCache.has(structure)) { result = this._repoCache.get(structure)!; } else {
			let option = this.$design.$options.get(this);
			result = new Repository(this, structure, option);
		}

		// 拖曳完成的話就把快取清空
		if(!this.$design.$dragging) this._repoCache.clear();

		// 快取一切拖曳過程中產生出來的 Repository
		this._repoCache.set(structure, result);

		return result;
	}

	/** 整個 {@link Stretch} 所共用的相位參數，一律以第一個 {@link Junction} 為準 */
	public get fx(): Sign { return this.$junctions[0]?.fx ?? 1; }

	/** 整個 {@link Stretch} 所共用的相位參數，一律以第一個 {@link Junction} 為準 */
	public get fy(): Sign { return this.$junctions[0]?.fy ?? 1; }

	protected get $shouldDispose(): boolean {
		// 正在拖曳中的時候 Stretch 會暫時保留，以免因為單一 Flap 的拖曳經過導致當前的設定全部流失
		return super.$shouldDispose || !this._isActive && !this.$design.$dragging;
	}

	@shrewd public get _isActive(): boolean {
		// 這個涵蓋了任何一個 Flap 被刪除掉的情況
		return this.$design.$junctions.$teams.has(this.$signature);
	}

	@shrewd public get $pattern(): Pattern | null {
		return this.$repository?.entry?.entry ?? null;
	}

	@shrewd private get $isValid(): boolean {
		return this.$junctions.every(j => j.$status == JunctionStatus.overlap);
	}

	@shrewd public get $isTotallyValid(): boolean {
		if(!this._isActive) return false;
		for(let i = 0; i < this._flaps.length; i++) {
			for(let j = i + 1; j < this._flaps.length; j++) {
				let jn = this.$design.$junctions.get(this._flaps[i], this._flaps[j])!;
				if(jn.$status == JunctionStatus.tooClose) return false;
			}
		}
		return true;
	}

	@shrewd public get $structureSignature(): string {
		if(!this.$isValid) return "";
		return JSON.stringify(this.$junctions.map(j => {
			let result = j.toJSON();
			let c = result.c;
			// 把所有的 JJunction 的相位都調整成跟當前的 Stretch 一致
			if(j.fx != this.fx) result.c = [c[2], c[3], c[0], c[1]];
			return result;
		}));
	}

	public get $devices(): readonly Device[] {
		if(!this.$pattern) return [];
		return this.$pattern.$devices;
	}

	public toJSON(): JStretch {
		return {
			id: Junction.$createTeamId(this.$junctions),

			configuration: this.$pattern?.$configuration.toJSON(),

			// 並不排除找不到任何 Pattern 的可能性
			pattern: this.$pattern?.toJSON(),
		};
	}
}
