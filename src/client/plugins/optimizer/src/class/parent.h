
#pragma once

#include <vector>

using namespace std;

class Parent {
  public:
	Parent(double *&ptr);

	int id;
	double radius;
	vector<int> children;
};
