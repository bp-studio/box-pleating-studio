
namespace ArrayUtil {

	export function compare<T>(oldArray: readonly T[], newArray: readonly T[]): readonly T[] {
		if(oldArray.length != newArray.length) return newArray;
		for(let item of newArray) if(!oldArray.includes(item)) return newArray;
		return oldArray;
	}
}
