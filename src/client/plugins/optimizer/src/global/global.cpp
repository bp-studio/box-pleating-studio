
#include "global.h"

int Shared::flap_count = 0;
int Shared::dim = 0;
int Shared::last = 0;
bool Shared::async = false;

void Shared::setup(int count) {
	Shared::flap_count = count;
	Shared::dim = Shared::flap_count * 2 + 1;
	Shared::last = Shared::dim - 1;
}
