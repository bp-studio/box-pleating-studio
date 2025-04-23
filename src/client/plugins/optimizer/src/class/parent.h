
#pragma once

#include <emscripten/bind.h>
#include <vector>

using namespace std;

class Parent {
  public:
	Parent(const emscripten::val &data);

	int id;
	double radius;
	vector<int> children;
};
