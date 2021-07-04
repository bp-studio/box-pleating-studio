
//////////////////////////////////////////////////////////////////
/**
 * {@link SheetObject} 是所有存在於 {@link Sheet} 上頭的實體或抽象物件。
 *
 * 任何的 {@link SheetObject} 都會自動掛載於 {@link Sheet} 之上，
 * 而除此之外的掛載控制可以藉由覆寫 {@link Mountable._isActive} 屬性來決定。
 */
//////////////////////////////////////////////////////////////////

abstract class SheetObject extends Mountable implements IDesignObject {

	public readonly $sheet: Sheet;

	public constructor(sheet: Sheet) {
		super(sheet);
		this.$sheet = sheet;
	}

	public get $design(): Design {
		return this.$sheet.$design;
	}
}
