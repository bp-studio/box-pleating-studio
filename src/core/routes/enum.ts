
export enum ResponseCode {
	/** 請求成功，沒有發生任何問題 */
	success,

	/** 代表請求操作的前置條件並不滿足 */
	operationRejected,

	/** 傳入的資料格式有錯誤 */
	invalidFormat,

	/** 傳入的資料格式包含了被棄用的格式 */
	deprecatedFormat,
}
