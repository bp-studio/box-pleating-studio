
#include "interrupt.h"
#include "global.h"

#include <emscripten.h>

// clang-format off
EM_ASYNC_JS(const bool*, check_interrupt_async, (), {
	const value = await Module.checkInterruptAsync();
	const ptr = _malloc(1);
	setValue(ptr, value, "i8");
	return ptr;
});

EM_JS(const bool*, check_interrupt_sync, (), {
	const value = Module.checkInterrupt();
	const ptr = _malloc(1);
	setValue(ptr, value, "i8");
	return ptr;
});
// clang-format on

bool check_interrupt() {
	const bool *ptr = Shared::async ? check_interrupt_async() : check_interrupt_sync();
	auto result = *ptr;
	std::free((void *)ptr);
	return result;
}
