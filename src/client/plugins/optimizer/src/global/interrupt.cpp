
#include "interrupt.h"
#include "global.h"

#include <emscripten.h>

// clang-format off
EM_ASYNC_JS(bool, check_interrupt_async, (), {
	return await Module.checkInterruptAsync();
});

EM_JS(bool, check_interrupt_sync, (), {
	return Module.checkInterrupt();
});
// clang-format on

bool check_interrupt() {
	return Shared::async ? check_interrupt_async() : check_interrupt_sync();
}
