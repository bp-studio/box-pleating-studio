
#include "interrupt.h"
#include "global.h"

#include <emscripten.h>

// Since we now have two different production build,
// we only include one implementation in each case.

#ifdef _OPENMP

// clang-format off
EM_JS(bool, check_interrupt_sync, (), {
	if(!Module.checkInterrupt) return false;
	return Module.checkInterrupt();
});
// clang-format on

bool check_interrupt() {
	return check_interrupt_sync();
}

#else

// clang-format off
EM_ASYNC_JS(bool, check_interrupt_async, (), {
	return await Module.checkInterruptAsync();
});
// clang-format on

bool check_interrupt() {
	return check_interrupt_async();
}

#endif
